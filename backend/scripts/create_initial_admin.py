#!/usr/bin/env python
"""Provision the first institution administrator without demo credentials."""

import argparse
import asyncio
import getpass
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.password_policy import ADMIN_POLICY, validate_password
from app.core.security import hash_password
from app.db.engine import AsyncSessionLocal
from app.db.models import (
    CredentialStatus,
    Institution,
    Role,
    User,
    UserCredential,
    UserRole,
    UserStatus,
)
from app.services.role_seed import ensure_system_roles


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True, help="Administrator email")
    parser.add_argument("--username", default="admin", help="Administrator username")
    parser.add_argument("--display-name", default="Administrador", help="Administrator display name")
    parser.add_argument("--institution-name", default="AITHRON EDU", help="Institution name")
    parser.add_argument("--institution-code", default="AITHRON", help="Institution code")
    parser.add_argument(
        "--password-env",
        default="AITHRON_ADMIN_PASSWORD",
        help="Environment variable that contains the initial password",
    )
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="Replace the password if the administrator already exists",
    )
    return parser.parse_args()


def read_password(variable: str) -> str:
    password = os.environ.get(variable)
    if password:
        return password
    if sys.stdin.isatty():
        return getpass.getpass("Initial administrator password: ")
    raise SystemExit(f"Set the {variable} environment variable before running this script")


async def provision(args: argparse.Namespace) -> None:
    password = read_password(args.password_env)
    valid, errors = validate_password(
        password,
        ADMIN_POLICY,
        {"display_name": args.display_name, "email": args.email, "username": args.username},
    )
    if not valid:
        raise SystemExit("Password rejected: " + "; ".join(errors))

    async with AsyncSessionLocal() as session:
        roles = await ensure_system_roles(session)
        admin_role = roles.get("ADMIN")
        if not admin_role:
            raise SystemExit("ADMIN role could not be provisioned")

        institution_stmt = select(Institution).where(Institution.code == args.institution_code)
        institution = (await session.execute(institution_stmt)).scalars().first()
        if not institution:
            institution = Institution(
                name=args.institution_name,
                code=args.institution_code,
                timezone="America/Lima",
                default_language="es",
                status="active",
            )
            session.add(institution)
            await session.flush()

        user_stmt = select(User).where(User.email == args.email)
        user = (await session.execute(user_stmt)).scalars().first()
        created = user is None

        if not user:
            user = User(
                username=args.username,
                display_name=args.display_name,
                email=args.email,
                status=UserStatus.ACTIVE,
                institution_id=str(institution.id),
            )
            session.add(user)
            await session.flush()
        else:
            user.institution_id = str(institution.id)
            user.status = UserStatus.ACTIVE

        credential_stmt = select(UserCredential).where(UserCredential.user_id == str(user.id))
        credential = (await session.execute(credential_stmt)).scalars().first()

        if credential is None:
            credential = UserCredential(
                user_id=str(user.id),
                password_hash=hash_password(password),
                password_algorithm="argon2id",
                status=CredentialStatus.ACTIVE,
            )
            session.add(credential)
        elif args.reset_password:
            credential.password_hash = hash_password(password)
            credential.password_algorithm = "argon2id"
            credential.status = CredentialStatus.ACTIVE
            credential.failed_attempts = 0
            credential.locked_until = None

        membership_stmt = select(UserRole).where(
            UserRole.user_id == str(user.id),
            UserRole.role_id == str(admin_role.id),
            UserRole.institution_id == str(institution.id),
        )
        membership = (await session.execute(membership_stmt)).scalars().first()

        if membership is None:
            session.add(
                UserRole(
                    user_id=str(user.id),
                    role_id=str(admin_role.id),
                    institution_id=str(institution.id),
                    is_active=True,
                )
            )
        else:
            membership.is_active = True

        await session.commit()

        status = "created" if created else "updated"
        print(f"Administrator {status}: {user.email} (username: {user.username})")
        print(f"Institution: {institution.name} (code: {institution.code})")
        print("The password was not printed. Store it in a password manager.")


if __name__ == "__main__":
    asyncio.run(provision(parse_args()))
