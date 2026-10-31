"""Operator-run encrypted backup and empty-target restore drill. No automatic schedule.

Needs pg_dump/pg_restore/psql + age. Credentials come from external libpq service/
password files, never command-line URLs. This file does not provision those tools.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from uuid import uuid4


ROOT = Path(__file__).resolve().parents[2]


def service_name(value):
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,63}", value):
        raise ValueError("Invalid service identifier")
    return value


def external_file(value):
    result = Path(value).resolve(strict=True)
    if result.is_relative_to(ROOT) or not result.is_file():
        raise ValueError("Private operational files must be outside the repository")
    return result


def digest(file):
    result = hashlib.sha256()
    with file.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def credentials():
    for key in ("PGSERVICEFILE", "PGPASSFILE"):
        if not os.environ.get(key):
            raise ValueError("External libpq service/password files required")
        external_file(os.environ[key])


def backup(args):
    directory = Path(args.output_dir).resolve()
    if directory.is_relative_to(ROOT):
        raise ValueError("Backups must not be written inside the repository/public tree")
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    recipients = external_file(args.recipients_file)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    target = directory / f"aithron-{stamp}-{uuid4().hex}.dump.age"
    partial = target.with_suffix(".age.incomplete")
    with partial.open("xb") as encrypted, tempfile.TemporaryFile() as errors:
        os.chmod(partial, 0o600)
        dump = subprocess.Popen(["pg_dump", "--dbname", f"service={args.service}", "--format=custom", "--no-owner", "--no-acl"], stdout=subprocess.PIPE, stderr=errors)
        try:
            encrypted_result = subprocess.run(["age", "--encrypt", "--recipients-file", str(recipients)], stdin=dump.stdout, stdout=encrypted, stderr=errors, timeout=300)
            dump.stdout.close()
            dump_result = dump.wait(timeout=30)
            if encrypted_result.returncode or dump_result:
                raise RuntimeError("Backup pipeline failed")
            encrypted.flush()
            os.fsync(encrypted.fileno())
        finally:
            if dump.poll() is None:
                dump.kill()
                dump.wait()
    partial.rename(target)
    metadata = {"format": "pg_dump_custom_age", "createdUtc": stamp,
                "file": target.name, "sha256": digest(target), "restoreVerified": False}
    with target.with_suffix(".age.json").open("x", encoding="utf-8") as output:
        json.dump(metadata, output, indent=2)
    print("Encrypted backup created; restoration is NOT verified. No credentials printed.")


def restore(args):
    source = external_file(args.archive)
    identity = external_file(args.identity_file)
    if digest(source) != args.sha256:
        raise ValueError("Encrypted archive checksum mismatch")
    # Validate the complete authenticated ciphertext before opening a restore stream.
    subprocess.run(["age", "--decrypt", "--identity", str(identity), str(source)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=300, check=True)
    info = subprocess.run(["psql", "--dbname", f"service={args.service}", "--no-psqlrc", "--tuples-only", "--no-align", "--set", "ON_ERROR_STOP=1", "--command",
        "SELECT json_build_object('database', current_database(), 'objects', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'))"], capture_output=True, text=True, timeout=30, check=True)
    target = json.loads(info.stdout)
    if target["database"] != args.confirm_database or not target["database"].endswith("_restore_test") or target["objects"] != 0:
        raise ValueError("Restore requires a confirmed EMPTY dedicated _restore_test database")
    with tempfile.TemporaryFile() as errors:
        decrypt = subprocess.Popen(["age", "--decrypt", "--identity", str(identity), str(source)], stdout=subprocess.PIPE, stderr=errors)
        try:
            result = subprocess.run(["pg_restore", "--dbname", f"service={args.service}", "--single-transaction", "--exit-on-error", "--no-owner", "--no-acl"], stdin=decrypt.stdout, stderr=errors, stdout=subprocess.DEVNULL, timeout=300)
            decrypt.stdout.close()
            decrypt_result = decrypt.wait(timeout=30)
            if result.returncode or decrypt_result:
                raise RuntimeError("Restore failed; integrity must be inspected by operator")
        finally:
            if decrypt.poll() is None:
                decrypt.kill()
                decrypt.wait()
    print("Restore command completed in an empty test database; application/data verification still required.")


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="operation", required=True)
    save = commands.add_parser("backup")
    save.add_argument("--output-dir", required=True)
    save.add_argument("--recipients-file", required=True)
    load = commands.add_parser("restore-test")
    load.add_argument("--archive", required=True)
    load.add_argument("--identity-file", required=True)
    load.add_argument("--sha256", required=True)
    load.add_argument("--confirm-database", required=True)
    for command in (save, load):
        command.add_argument("--service", required=True, type=service_name)
        command.add_argument("--confirm-service", required=True)
    args = parser.parse_args()
    if args.service != args.confirm_service:
        raise ValueError("Explicit service confirmation required")
    credentials()
    backup(args) if args.operation == "backup" else restore(args)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        raise SystemExit("Backup/restore NOT verified. Operation failed or refused; private details withheld. Incomplete files are retained for operator inspection.") from None
