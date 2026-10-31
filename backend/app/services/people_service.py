"""Services for institution-scoped people and membership management."""

import math
from datetime import date, datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.core.password_policy import ADMIN_POLICY, DEFAULT_POLICY, STUDENT_POLICY, validate_password
from app.core.security import hash_password
from app.db.models import (
    AuthSession,
    Institution,
    MonitorProfile,
    RefreshToken,
    Role,
    SessionStatus,
    StudentProfile,
    User,
    UserCredential,
    UserRole,
    UserStatus,
)
from app.schemas.people import (
    InstitutionUpdate,
    MembershipCreate,
    MembershipUpdate,
    MonitorCreate,
    MonitorUpdate,
    StudentCreate,
    StudentDetail,
    StudentOut,
    StudentUpdate,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.services.role_seed import ensure_system_roles


def _pages(total: int, page_size: int) -> int:
    return math.ceil(total / page_size) if total else 0


def _user_status(value: str) -> UserStatus:
    try:
        return UserStatus(value)
    except ValueError:
        raise ValidationError("Invalid user status")


class PeopleService:
    """Institution-scoped operations for users, students, monitors, and memberships."""

    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    async def _get_role(self, role_code: str) -> Role:
        result = await self.session.execute(select(Role).where(Role.code == role_code))
        role = result.scalars().first()
        if role:
            return role

        await ensure_system_roles(self.session)
        await self.session.flush()
        result = await self.session.execute(select(Role).where(Role.code == role_code))
        role = result.scalars().first()
        if not role:
            raise ValidationError(f"Unknown role code: {role_code}")
        return role

    async def _ensure_unique_user(
        self,
        username: Optional[str],
        email: Optional[str],
        exclude_user_id: Optional[str] = None,
    ) -> None:
        conditions = []
        if username:
            conditions.append(func.lower(User.username) == username.lower())
        if email:
            conditions.append(func.lower(User.email) == email.lower())
        if not conditions:
            return

        stmt = select(User.id).where(or_(*conditions))
        if exclude_user_id:
            stmt = stmt.where(User.id != exclude_user_id)

        result = await self.session.execute(stmt)
        if result.scalars().first():
            raise ConflictError("Username or email is already in use")

    async def _ensure_unique_student_code(
        self,
        student_code: str,
        exclude_student_id: Optional[str] = None,
    ) -> None:
        stmt = select(StudentProfile.id).where(
            func.lower(StudentProfile.student_code) == student_code.lower()
        )
        if exclude_student_id:
            stmt = stmt.where(StudentProfile.id != exclude_student_id)
        result = await self.session.execute(stmt)
        if result.scalars().first():
            raise ConflictError("Student code is already in use")

    async def _ensure_unique_employee_code(
        self,
        employee_code: str,
        exclude_monitor_id: Optional[str] = None,
    ) -> None:
        stmt = select(MonitorProfile.id).where(
            func.lower(MonitorProfile.employee_code) == employee_code.lower()
        )
        if exclude_monitor_id:
            stmt = stmt.where(MonitorProfile.id != exclude_monitor_id)
        result = await self.session.execute(stmt)
        if result.scalars().first():
            raise ConflictError("Employee code is already in use")

    async def _create_base_user(
        self,
        institution_id: UUID,
        username: str,
        display_name: str,
        email: Optional[str],
        phone: Optional[str],
        password: str,
        role_code: str,
        assigned_by: UUID,
    ) -> User:
        policy = {
            "ADMIN": ADMIN_POLICY,
            "STUDENT": STUDENT_POLICY,
            "MONITOR": DEFAULT_POLICY,
        }.get(role_code, DEFAULT_POLICY)
        is_valid, errors = validate_password(
            password,
            policy,
            {"display_name": display_name, "email": email or "", "username": username},
        )
        if not is_valid:
            raise ValidationError("; ".join(errors))

        await self._ensure_unique_user(username, email)
        role = await self._get_role(role_code)

        user = User(
            institution_id=str(institution_id),
            username=username,
            display_name=display_name,
            email=email,
            phone=phone,
            status=UserStatus.ACTIVE,
        )
        self.session.add(user)
        await self.session.flush()

        credential = UserCredential(
            user_id=str(user.id),
            password_hash=hash_password(password),
            password_algorithm="argon2id",
        )
        membership = UserRole(
            user_id=str(user.id),
            role_id=str(role.id),
            institution_id=str(institution_id),
            assigned_by=str(assigned_by),
            is_active=True,
        )
        self.session.add(credential)
        self.session.add(membership)
        await self.session.flush()

        return user

    async def _get_user_model(self, institution_id: UUID, user_id: UUID) -> User:
        stmt = (
            select(User)
            .where(User.id == str(user_id), User.institution_id == str(institution_id))
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
        )
        result = await self.session.execute(stmt)
        user = result.scalars().first()
        if not user:
            raise NotFoundError("User not found")
        return user

    async def _get_student_model(self, institution_id: UUID, student_id: UUID) -> StudentProfile:
        stmt = (
            select(StudentProfile)
            .join(User, StudentProfile.user_id == User.id)
            .where(
                StudentProfile.id == str(student_id),
                User.institution_id == str(institution_id),
            )
            .options(
                selectinload(StudentProfile.user)
                .selectinload(User.user_roles)
                .selectinload(UserRole.role)
            )
        )
        result = await self.session.execute(stmt)
        student = result.scalars().first()
        if not student:
            raise NotFoundError("Student not found")
        return student

    async def _get_monitor_model(self, institution_id: UUID, monitor_id: UUID) -> MonitorProfile:
        stmt = (
            select(MonitorProfile)
            .join(User, MonitorProfile.user_id == User.id)
            .where(
                MonitorProfile.id == str(monitor_id),
                User.institution_id == str(institution_id),
            )
            .options(
                selectinload(MonitorProfile.user)
                .selectinload(User.user_roles)
                .selectinload(UserRole.role)
            )
        )
        result = await self.session.execute(stmt)
        monitor = result.scalars().first()
        if not monitor:
            raise NotFoundError("Monitor not found")
        return monitor

    async def _get_membership_model(self, institution_id: UUID, membership_id: UUID) -> UserRole:
        stmt = (
            select(UserRole)
            .join(User, UserRole.user_id == User.id)
            .where(
                UserRole.id == str(membership_id),
                UserRole.institution_id == str(institution_id),
                User.institution_id == str(institution_id),
            )
            .options(selectinload(UserRole.role), selectinload(UserRole.user))
        )
        result = await self.session.execute(stmt)
        membership = result.scalars().first()
        if not membership:
            raise NotFoundError("Membership not found")
        return membership

    @staticmethod
    def user_out(user: User) -> UserOut:
        roles = sorted(
            {
                membership.role.code
                for membership in user.user_roles
                if membership.is_active and membership.role
            }
        )
        return UserOut(
            id=UUID(user.id),
            institution_id=UUID(user.institution_id),
            username=user.username,
            display_name=user.display_name,
            email=user.email,
            phone=user.phone,
            status=user.status.value,
            roles=roles,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    @staticmethod
    def student_out(student: StudentProfile, detail: bool = False) -> StudentOut | StudentDetail:
        user = student.user
        payload = dict(
            id=UUID(student.id),
            user_id=UUID(student.user_id),
            institution_id=UUID(user.institution_id),
            student_code=student.student_code,
            display_name=user.display_name,
            username=user.username,
            email=user.email,
            grade=student.grade,
            section=student.section,
            status=user.status.value,
            created_at=student.created_at,
        )
        if detail:
            return StudentDetail(
                **payload,
                birth_date=student.birth_date,
                guardian_name=student.guardian_name,
                guardian_phone=student.guardian_phone,
                has_medical_info=bool(student.medical_info),
            )
        return StudentOut(**payload)

    @staticmethod
    def monitor_out(monitor: MonitorProfile) -> dict:
        user = monitor.user
        return dict(
            id=UUID(monitor.id),
            user_id=UUID(monitor.user_id),
            institution_id=UUID(user.institution_id),
            employee_code=monitor.employee_code,
            display_name=user.display_name,
            username=user.username,
            email=user.email,
            title=monitor.title,
            department=monitor.department,
            specialties=monitor.specialties or [],
            max_students=monitor.max_students,
            status=user.status.value,
            created_at=monitor.created_at,
        )

    @staticmethod
    def membership_out(membership: UserRole) -> dict:
        return dict(
            id=UUID(membership.id),
            user_id=UUID(membership.user_id),
            institution_id=UUID(membership.institution_id),
            role_id=UUID(membership.role_id),
            role_code=membership.role.code if membership.role else "",
            user_display_name=membership.user.display_name if membership.user else "",
            is_active=membership.is_active,
            assigned_at=membership.assigned_at,
            expires_at=membership.expires_at,
        )

    async def list_users(
        self,
        institution_id: UUID,
        *,
        page: int,
        page_size: int,
        search: Optional[str],
        status: Optional[str],
        sort_by: str,
        sort_order: str,
    ) -> Tuple[List[UserOut], int]:
        conditions = [User.institution_id == str(institution_id)]
        if status:
            conditions.append(User.status == _user_status(status))
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(User.display_name).like(pattern),
                    func.lower(User.username).like(pattern),
                    func.lower(User.email).like(pattern),
                )
            )

        total_result = await self.session.execute(
            select(func.count()).select_from(User).where(*conditions)
        )
        total = int(total_result.scalar_one())

        sort_columns = {
            "display_name": User.display_name,
            "username": User.username,
            "email": User.email,
            "status": User.status,
            "created_at": User.created_at,
        }
        sort_column = sort_columns.get(sort_by)
        if not sort_column:
            raise ValidationError("Invalid sort field")

        order = sort_column.desc() if sort_order == "desc" else sort_column.asc()
        stmt = (
            select(User)
            .where(*conditions)
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
            .order_by(order, User.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.execute(stmt)
        users = result.scalars().all()
        return [self.user_out(user) for user in users], total

    async def get_user(self, institution_id: UUID, user_id: UUID) -> UserOut:
        return self.user_out(await self._get_user_model(institution_id, user_id))

    async def create_user(
        self,
        institution_id: UUID,
        data: UserCreate,
        assigned_by: UUID,
    ) -> UserOut:
        user = await self._create_base_user(
            institution_id=institution_id,
            username=data.username,
            display_name=data.display_name,
            email=str(data.email) if data.email else None,
            phone=data.phone,
            password=data.password,
            role_code=data.role_code,
            assigned_by=assigned_by,
        )
        await self.session.refresh(user)
        return self.user_out(await self._get_user_model(institution_id, UUID(user.id)))

    async def update_user(
        self,
        institution_id: UUID,
        user_id: UUID,
        data: UserUpdate,
    ) -> UserOut:
        user = await self._get_user_model(institution_id, user_id)

        if data.username is not None or data.email is not None:
            await self._ensure_unique_user(
                data.username if data.username is not None else user.username,
                str(data.email) if data.email is not None else user.email,
                exclude_user_id=str(user.id),
            )

        if data.username is not None:
            user.username = data.username
        if data.display_name is not None:
            user.display_name = data.display_name
        if data.email is not None:
            user.email = str(data.email)
        if data.phone is not None:
            user.phone = data.phone
        if data.status is not None:
            user.status = _user_status(data.status)
            if data.status != UserStatus.ACTIVE.value:
                for membership in user.user_roles:
                    membership.is_active = False

        await self.session.flush()
        return self.user_out(user)

    async def deactivate_user(
        self,
        institution_id: UUID,
        user_id: UUID,
        current_user_id: UUID,
    ) -> None:
        if user_id == current_user_id:
            raise ForbiddenError("You cannot deactivate your own account")

        user = await self._get_user_model(institution_id, user_id)
        await self._ensure_not_last_admin(institution_id, user.id)

        user.status = UserStatus.INACTIVE
        for membership in user.user_roles:
            membership.is_active = False

        now = self._now()
        sessions_result = await self.session.execute(
            select(AuthSession).where(
                AuthSession.user_id == str(user.id),
                AuthSession.status == SessionStatus.ACTIVE,
            )
        )
        for auth_session in sessions_result.scalars().all():
            auth_session.status = SessionStatus.REVOKED
            auth_session.revoked_at = now
            auth_session.revoke_reason = "user_deactivated"

        await self.session.execute(
            RefreshToken.__table__.update()
            .where(RefreshToken.session_id.in_(
                select(AuthSession.id).where(AuthSession.user_id == str(user.id))
            ))
            .values(status="revoked", revoked_at=now, revoke_reason="user_deactivated")
        )
        await self.session.flush()

    async def list_students(
        self,
        institution_id: UUID,
        *,
        page: int,
        page_size: int,
        search: Optional[str],
        status: Optional[str],
        grade: Optional[int],
        section: Optional[str],
        sort_by: str,
        sort_order: str,
    ) -> Tuple[List[StudentOut], int]:
        conditions = [User.institution_id == str(institution_id)]
        if status:
            conditions.append(User.status == _user_status(status))
        if grade is not None:
            conditions.append(StudentProfile.grade == grade)
        if section:
            conditions.append(StudentProfile.section == section)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(User.display_name).like(pattern),
                    func.lower(User.username).like(pattern),
                    func.lower(User.email).like(pattern),
                    func.lower(StudentProfile.student_code).like(pattern),
                    func.lower(StudentProfile.guardian_name).like(pattern),
                )
            )

        count_stmt = (
            select(func.count())
            .select_from(StudentProfile)
            .join(User, StudentProfile.user_id == User.id)
            .where(*conditions)
        )
        total = int((await self.session.execute(count_stmt)).scalar_one())

        sort_columns = {
            "display_name": User.display_name,
            "student_code": StudentProfile.student_code,
            "grade": StudentProfile.grade,
            "created_at": StudentProfile.created_at,
        }
        sort_column = sort_columns.get(sort_by)
        if not sort_column:
            raise ValidationError("Invalid sort field")

        order = sort_column.desc() if sort_order == "desc" else sort_column.asc()
        stmt = (
            select(StudentProfile)
            .join(User, StudentProfile.user_id == User.id)
            .where(*conditions)
            .options(
                selectinload(StudentProfile.user)
                .selectinload(User.user_roles)
                .selectinload(UserRole.role)
            )
            .order_by(order, StudentProfile.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        students = (await self.session.execute(stmt)).scalars().all()
        return [self.student_out(student) for student in students], total

    async def get_student(
        self,
        institution_id: UUID,
        student_id: UUID,
        *,
        detail: bool = False,
    ) -> StudentOut | StudentDetail:
        return self.student_out(
            await self._get_student_model(institution_id, student_id),
            detail=detail,
        )

    async def create_student(
        self,
        institution_id: UUID,
        data: StudentCreate,
        assigned_by: UUID,
    ) -> StudentDetail:
        await self._ensure_unique_student_code(data.student_code)
        role = await self._get_role("STUDENT")

        user = await self._create_base_user(
            institution_id=institution_id,
            username=data.username,
            display_name=data.display_name,
            email=str(data.email) if data.email else None,
            phone=data.phone,
            password=data.password,
            role_code=role.code,
            assigned_by=assigned_by,
        )

        student = StudentProfile(
            user_id=str(user.id),
            student_code=data.student_code,
            grade=data.grade,
            section=data.section,
            course_keys=data.course_keys,
            birth_date=data.birth_date,
            guardian_name=data.guardian_name,
            guardian_phone=data.guardian_phone,
        )
        self.session.add(student)
        await self.session.flush()

        return self.student_out(
            await self._get_student_model(institution_id, UUID(student.id)),
            detail=True,
        )

    async def update_student(
        self,
        institution_id: UUID,
        student_id: UUID,
        data: StudentUpdate,
    ) -> StudentDetail:
        student = await self._get_student_model(institution_id, student_id)
        user = student.user

        if data.email is not None:
            await self._ensure_unique_user(None, str(data.email), exclude_user_id=str(user.id))

        if data.display_name is not None:
            user.display_name = data.display_name
        if data.email is not None:
            user.email = str(data.email)
        if data.phone is not None:
            user.phone = data.phone
        if data.status is not None:
            user.status = _user_status(data.status)

        if data.grade is not None:
            student.grade = data.grade
        if data.section is not None:
            student.section = data.section
        if data.birth_date is not None:
            student.birth_date = data.birth_date
        if data.guardian_name is not None:
            student.guardian_name = data.guardian_name
        if data.guardian_phone is not None:
            student.guardian_phone = data.guardian_phone
        if data.course_keys is not None:
            student.course_keys = data.course_keys

        await self.session.flush()
        return self.student_out(student, detail=True)

    async def deactivate_student(
        self,
        institution_id: UUID,
        student_id: UUID,
    ) -> None:
        student = await self._get_student_model(institution_id, student_id)
        student.user.status = UserStatus.INACTIVE
        for membership in student.user.user_roles:
            membership.is_active = False
        await self.session.flush()

    async def list_monitors(
        self,
        institution_id: UUID,
        *,
        page: int,
        page_size: int,
        search: Optional[str],
        status: Optional[str],
        department: Optional[str],
        sort_by: str,
        sort_order: str,
    ) -> Tuple[List[dict], int]:
        conditions = [User.institution_id == str(institution_id)]
        if status:
            conditions.append(User.status == _user_status(status))
        if department:
            conditions.append(MonitorProfile.department == department)
        if search:
            pattern = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(User.display_name).like(pattern),
                    func.lower(User.username).like(pattern),
                    func.lower(User.email).like(pattern),
                    func.lower(MonitorProfile.employee_code).like(pattern),
                    func.lower(MonitorProfile.department).like(pattern),
                )
            )

        count_stmt = (
            select(func.count())
            .select_from(MonitorProfile)
            .join(User, MonitorProfile.user_id == User.id)
            .where(*conditions)
        )
        total = int((await self.session.execute(count_stmt)).scalar_one())

        sort_columns = {
            "display_name": User.display_name,
            "employee_code": MonitorProfile.employee_code,
            "department": MonitorProfile.department,
            "created_at": MonitorProfile.created_at,
        }
        sort_column = sort_columns.get(sort_by)
        if not sort_column:
            raise ValidationError("Invalid sort field")

        order = sort_column.desc() if sort_order == "desc" else sort_column.asc()
        stmt = (
            select(MonitorProfile)
            .join(User, MonitorProfile.user_id == User.id)
            .where(*conditions)
            .options(
                selectinload(MonitorProfile.user)
                .selectinload(User.user_roles)
                .selectinload(UserRole.role)
            )
            .order_by(order, MonitorProfile.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        monitors = (await self.session.execute(stmt)).scalars().all()
        return [self.monitor_out(monitor) for monitor in monitors], total

    async def get_monitor(self, institution_id: UUID, monitor_id: UUID) -> dict:
        return self.monitor_out(await self._get_monitor_model(institution_id, monitor_id))

    async def create_monitor(
        self,
        institution_id: UUID,
        data: MonitorCreate,
        assigned_by: UUID,
    ) -> dict:
        await self._ensure_unique_employee_code(data.employee_code)
        role = await self._get_role("MONITOR")

        user = await self._create_base_user(
            institution_id=institution_id,
            username=data.username,
            display_name=data.display_name,
            email=str(data.email) if data.email else None,
            phone=data.phone,
            password=data.password,
            role_code=role.code,
            assigned_by=assigned_by,
        )

        monitor = MonitorProfile(
            user_id=str(user.id),
            employee_code=data.employee_code,
            title=data.title,
            department=data.department,
            specialties=data.specialties,
            max_students=data.max_students,
        )
        self.session.add(monitor)
        await self.session.flush()

        return self.monitor_out(
            await self._get_monitor_model(institution_id, UUID(monitor.id))
        )

    async def update_monitor(
        self,
        institution_id: UUID,
        monitor_id: UUID,
        data: MonitorUpdate,
    ) -> dict:
        monitor = await self._get_monitor_model(institution_id, monitor_id)
        user = monitor.user

        if data.email is not None:
            await self._ensure_unique_user(None, str(data.email), exclude_user_id=str(user.id))

        if data.display_name is not None:
            user.display_name = data.display_name
        if data.email is not None:
            user.email = str(data.email)
        if data.phone is not None:
            user.phone = data.phone
        if data.status is not None:
            user.status = _user_status(data.status)

        if data.title is not None:
            monitor.title = data.title
        if data.department is not None:
            monitor.department = data.department
        if data.specialties is not None:
            monitor.specialties = data.specialties
        if data.max_students is not None:
            monitor.max_students = data.max_students

        await self.session.flush()
        return self.monitor_out(monitor)

    async def deactivate_monitor(
        self,
        institution_id: UUID,
        monitor_id: UUID,
    ) -> None:
        monitor = await self._get_monitor_model(institution_id, monitor_id)
        monitor.user.status = UserStatus.INACTIVE
        for membership in monitor.user.user_roles:
            membership.is_active = False
        await self.session.flush()

    async def _ensure_not_last_admin(self, institution_id: UUID, user_id: str) -> None:
        admin_role = await self._get_role("ADMIN")
        target_stmt = select(UserRole).where(
            UserRole.user_id == user_id,
            UserRole.institution_id == str(institution_id),
            UserRole.role_id == str(admin_role.id),
            UserRole.is_active.is_(True),
        )
        target = (await self.session.execute(target_stmt)).scalars().first()
        if not target:
            return

        count_stmt = select(func.count()).select_from(UserRole).where(
            UserRole.institution_id == str(institution_id),
            UserRole.role_id == str(admin_role.id),
            UserRole.is_active.is_(True),
        )
        admin_count = int((await self.session.execute(count_stmt)).scalar_one())
        if admin_count <= 1:
            raise ConflictError("Cannot remove the last active administrator")

    async def create_membership(
        self,
        institution_id: UUID,
        data: MembershipCreate,
        assigned_by: UUID,
    ) -> dict:
        role = await self._get_role(data.role_code)
        user = await self._get_user_model(institution_id, data.user_id)

        existing_stmt = select(UserRole).where(
            UserRole.user_id == str(user.id),
            UserRole.role_id == str(role.id),
            UserRole.institution_id == str(institution_id),
        ).options(selectinload(UserRole.role), selectinload(UserRole.user))
        existing = (await self.session.execute(existing_stmt)).scalars().first()

        if existing:
            if existing.is_active:
                raise ConflictError("User already has this role in the institution")
            existing.is_active = True
            existing.expires_at = data.expires_at
            existing.assigned_at = self._now()
            existing.assigned_by = str(assigned_by)
            await self.session.flush()
            return self.membership_out(existing)

        membership = UserRole(
            user_id=str(user.id),
            role_id=str(role.id),
            institution_id=str(institution_id),
            assigned_by=str(assigned_by),
            expires_at=data.expires_at,
            is_active=True,
        )
        self.session.add(membership)
        await self.session.flush()
        return self.membership_out(
            await self._get_membership_model(institution_id, UUID(membership.id))
        )

    async def list_memberships(
        self,
        institution_id: UUID,
        *,
        page: int,
        page_size: int,
        user_id: Optional[UUID],
        role_code: Optional[str],
        is_active: Optional[bool],
    ) -> Tuple[List[dict], int]:
        conditions = [UserRole.institution_id == str(institution_id)]
        if user_id:
            conditions.append(UserRole.user_id == str(user_id))
        if role_code:
            conditions.append(Role.code == role_code)
        if is_active is not None:
            conditions.append(UserRole.is_active.is_(is_active))

        count_stmt = (
            select(func.count())
            .select_from(UserRole)
            .join(Role, UserRole.role_id == Role.id)
            .join(User, UserRole.user_id == User.id)
            .where(*conditions)
        )
        total = int((await self.session.execute(count_stmt)).scalar_one())

        stmt = (
            select(UserRole)
            .join(Role, UserRole.role_id == Role.id)
            .join(User, UserRole.user_id == User.id)
            .where(*conditions)
            .options(selectinload(UserRole.role), selectinload(UserRole.user))
            .order_by(UserRole.assigned_at.desc(), UserRole.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        memberships = (await self.session.execute(stmt)).scalars().all()
        return [self.membership_out(membership) for membership in memberships], total

    async def update_membership(
        self,
        institution_id: UUID,
        membership_id: UUID,
        data: MembershipUpdate,
    ) -> dict:
        membership = await self._get_membership_model(institution_id, membership_id)

        if data.is_active is False and membership.is_active:
            if membership.role and membership.role.code == "ADMIN":
                await self._ensure_not_last_admin(institution_id, membership.user_id)
            membership.is_active = False

        if data.is_active is True:
            membership.is_active = True

        if data.expires_at is not None:
            membership.expires_at = data.expires_at

        await self.session.flush()
        return self.membership_out(membership)

    async def deactivate_membership(
        self,
        institution_id: UUID,
        membership_id: UUID,
    ) -> None:
        await self.update_membership(
            institution_id,
            membership_id,
            MembershipUpdate(is_active=False),
        )

    async def get_institution(self, institution_id: UUID) -> Institution:
        stmt = select(Institution).where(Institution.id == str(institution_id))
        institution = (await self.session.execute(stmt)).scalars().first()
        if not institution:
            raise NotFoundError("Institution not found")
        return institution

    async def update_institution(
        self,
        institution_id: UUID,
        data: InstitutionUpdate,
    ) -> Institution:
        institution = await self.get_institution(institution_id)

        if data.name is not None:
            institution.name = data.name
        if data.short_name is not None:
            institution.short_name = data.short_name
        if data.country_code is not None:
            institution.country_code = data.country_code
        if data.timezone is not None:
            institution.timezone = data.timezone
        if data.default_language is not None:
            institution.default_language = data.default_language
        if data.status is not None:
            institution.status = data.status

        await self.session.flush()
        return institution
