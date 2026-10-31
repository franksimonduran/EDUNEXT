"""System role and permission seeding."""

from typing import Dict, Iterable, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Permission, Role, RolePermission, UserRoleName
from app.schemas.permission import Permissions


ADMIN_PERMISSIONS = {
    Permissions.PROFILE_READ_OWN,
    Permissions.PROFILE_UPDATE_OWN,
    Permissions.COURSES_READ,
    Permissions.COURSES_CREATE,
    Permissions.COURSES_UPDATE,
    Permissions.COURSES_DELETE,
    Permissions.COURSES_PUBLISH,
    Permissions.UNITS_READ,
    Permissions.UNITS_CREATE,
    Permissions.UNITS_UPDATE,
    Permissions.UNITS_DELETE,
    Permissions.LESSONS_READ,
    Permissions.LESSONS_CREATE,
    Permissions.LESSONS_UPDATE,
    Permissions.LESSONS_DELETE,
    Permissions.PROGRESS_READ_ASSIGNED,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_CREATE,
    Permissions.ASSESSMENTS_UPDATE,
    Permissions.ASSESSMENTS_DELETE,
    Permissions.ASSESSMENTS_MANAGE_ASSIGNED,
    Permissions.ACADEMIC_YEARS_READ,
    Permissions.ACADEMIC_YEARS_MANAGE,
    Permissions.ACADEMIC_PERIODS_READ,
    Permissions.ACADEMIC_PERIODS_MANAGE,
    Permissions.GRADES_READ,
    Permissions.SECTIONS_READ,
    Permissions.SECTIONS_MANAGE,
    Permissions.ACADEMIC_MOVEMENTS_READ_INSTITUTION,
    Permissions.CLASSROOMS_READ,
    Permissions.CLASSROOMS_READ_INSTITUTION,
    Permissions.CLASSROOMS_MANAGE_INSTITUTION,
    Permissions.CLASSROOMS_CREATE,
    Permissions.CLASSROOMS_UPDATE,
    Permissions.CLASSROOMS_DELETE,
    Permissions.STUDENTS_READ_INSTITUTION,
    Permissions.STUDENTS_MANAGE_INSTITUTION,
    Permissions.ENROLLMENTS_READ_INSTITUTION,
    Permissions.ENROLLMENTS_CREATE_INSTITUTION,
    Permissions.ENROLLMENTS_MANAGE_INSTITUTION,
    Permissions.ENROLLMENTS_TRANSFER_INSTITUTION,
    Permissions.TEACHER_ASSIGNMENTS_READ,
    Permissions.TEACHER_ASSIGNMENTS_READ_INSTITUTION,
    Permissions.TEACHER_ASSIGNMENTS_MANAGE,
    Permissions.TEACHER_ASSIGNMENTS_MANAGE_INSTITUTION,
    Permissions.USERS_READ_INSTITUTION,
    Permissions.USERS_MANAGE_INSTITUTION,
    Permissions.USERS_CREATE_INSTITUTION,
    Permissions.MONITORS_READ_INSTITUTION,
    Permissions.MONITORS_MANAGE_INSTITUTION,
    Permissions.MEMBERSHIPS_READ_INSTITUTION,
    Permissions.MEMBERSHIPS_MANAGE_INSTITUTION,
    Permissions.INSTITUTIONS_READ,
    Permissions.INSTITUTIONS_MANAGE,
    Permissions.ROLES_READ_INSTITUTION,
    Permissions.ROLES_ASSIGN_INSTITUTION,
    Permissions.ROLES_MANAGE_INSTITUTION,
    Permissions.CONTENT_READ,
    Permissions.CONTENT_CREATE,
    Permissions.CONTENT_UPDATE,
    Permissions.CONTENT_DELETE,
    Permissions.CONTENT_REVIEW_INSTITUTION,
    Permissions.CONTENT_PUBLISH_INSTITUTION,
    Permissions.REPORTS_READ_INSTITUTION,
    Permissions.SETTINGS_READ_INSTITUTION,
    Permissions.SETTINGS_MANAGE_INSTITUTION,
    Permissions.REINFORCEMENT_MANAGE,
    Permissions.SYSTEM_HEALTH,
}

MONITOR_PERMISSIONS = {
    Permissions.PROFILE_READ_OWN,
    Permissions.PROFILE_UPDATE_OWN,
    Permissions.COURSES_READ,
    Permissions.UNITS_READ,
    Permissions.LESSONS_READ,
    Permissions.PROGRESS_READ_ASSIGNED,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_GRADE_ASSIGNED,
    Permissions.ASSESSMENTS_MANAGE_ASSIGNED,
    Permissions.ACADEMIC_YEARS_READ,
    Permissions.ACADEMIC_PERIODS_READ,
    Permissions.GRADES_READ,
    Permissions.SECTIONS_READ,
    Permissions.CLASSROOMS_READ_ASSIGNED,
    Permissions.STUDENTS_READ_ASSIGNED,
    Permissions.ENROLLMENTS_READ_ASSIGNED,
    Permissions.TEACHER_ASSIGNMENTS_READ,
    Permissions.TEACHER_ASSIGNMENTS_READ_OWN,
    Permissions.REPORTS_READ_ASSIGNED,
    Permissions.REINFORCEMENT_READ_ASSIGNED,
    Permissions.REINFORCEMENT_MANAGE,
}

STUDENT_PERMISSIONS = {
    Permissions.PROFILE_READ_OWN,
    Permissions.PROFILE_UPDATE_OWN,
    Permissions.COURSES_READ,
    Permissions.UNITS_READ,
    Permissions.LESSONS_READ,
    Permissions.PROGRESS_READ_OWN,
    Permissions.ASSESSMENTS_READ,
    Permissions.ASSESSMENTS_SUBMIT_OWN,
    Permissions.ACADEMIC_YEARS_READ,
    Permissions.ACADEMIC_PERIODS_READ,
    Permissions.GRADES_READ,
    Permissions.SECTIONS_READ,
    Permissions.STUDENTS_READ_OWN,
    Permissions.ENROLLMENTS_READ_OWN,
    Permissions.REPORTS_READ_OWN,
    Permissions.REINFORCEMENT_READ_OWN,
}

ROLE_DEFINITIONS: Dict[str, Dict[str, object]] = {
    UserRoleName.ADMIN.value: {
        "name": "Administrador",
        "description": "Administración institucional completa",
        "permissions": ADMIN_PERMISSIONS,
    },
    UserRoleName.MONITOR.value: {
        "name": "Monitor / Docente",
        "description": "Acompañamiento académico de estudiantes asignados",
        "permissions": MONITOR_PERMISSIONS,
    },
    UserRoleName.STUDENT.value: {
        "name": "Estudiante",
        "description": "Acceso a contenidos y actividades propias",
        "permissions": STUDENT_PERMISSIONS,
    },
}


def _all_permission_codes() -> List[str]:
    codes = set()
    for definition in ROLE_DEFINITIONS.values():
        codes.update(definition["permissions"])
    return sorted(codes)


async def ensure_system_roles(session: AsyncSession) -> Dict[str, Role]:
    """Create or update system roles and their permissions."""
    permission_result = await session.execute(select(Permission))
    permissions_by_code = {permission.code: permission for permission in permission_result.scalars().all()}

    for code in _all_permission_codes():
        if code in permissions_by_code:
            continue
        resource, _, action = code.partition(".")
        permission = Permission(
            code=code,
            name=code,
            description=None,
            resource=resource or code,
            action=action or "access",
            scope="institution",
        )
        session.add(permission)
        permissions_by_code[code] = permission

    await session.flush()

    role_result = await session.execute(select(Role))
    roles_by_code = {role.code: role for role in role_result.scalars().all()}

    for code, definition in ROLE_DEFINITIONS.items():
        permissions: Iterable[str] = definition["permissions"]
        permission_codes = sorted(permissions)

        role = roles_by_code.get(code)
        if not role:
            role = Role(
                code=code,
                name=str(definition["name"]),
                description=str(definition["description"]),
                is_system=True,
                permissions=permission_codes,
            )
            session.add(role)
            roles_by_code[code] = role
        else:
            role.name = str(definition["name"])
            role.description = str(definition["description"])
            role.is_system = True
            role.permissions = permission_codes

    await session.flush()

    existing_links_result = await session.execute(select(RolePermission))
    existing_links = {
        (link.role_id, link.permission_id)
        for link in existing_links_result.scalars().all()
    }

    for code, definition in ROLE_DEFINITIONS.items():
        role = roles_by_code[code]
        for permission_code in sorted(definition["permissions"]):
            permission = permissions_by_code[permission_code]
            key = (str(role.id), str(permission.id))
            if key in existing_links:
                continue
            session.add(RolePermission(role_id=str(role.id), permission_id=str(permission.id)))
            existing_links.add(key)

    await session.flush()
    return roles_by_code
