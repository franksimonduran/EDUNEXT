"""Integration tests for Phase 37 academic organization APIs."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.db.engine import AsyncSessionLocal
from app.db.models import Course
from tests.conftest import ADMIN_ONE, ADMIN_PASSWORD, ADMIN_TWO

CSRF_HEADER = settings.CSRF_HEADER_NAME
USER_PASSWORD = "Testing-User-Passphrase-2026!"


def unique(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:8]}"


async def login(client: AsyncClient, identifier: str, password: str) -> dict:
    response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": identifier, "password": password},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    payload["headers"] = {
        "Authorization": f"Bearer {payload['access_token']}",
        CSRF_HEADER: payload["csrf_token"],
    }
    return payload


async def create_student(client: AsyncClient, headers: dict, **overrides) -> dict:
    suffix = uuid4().hex[:8]
    payload = {
        "username": f"student{suffix}",
        "display_name": "Student Phase37",
        "email": f"student{suffix}@athron.edu",
        "password": USER_PASSWORD,
        "student_code": f"STU-{suffix}",
        "grade": 4,
        "section": "A",
        "birth_date": "2015-05-20",
        "guardian_name": "Guardian Phase37",
        "guardian_phone": "+51999999999",
    }
    payload.update(overrides)
    response = await client.post("/api/v1/students", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


async def create_monitor(client: AsyncClient, headers: dict) -> dict:
    suffix = uuid4().hex[:8]
    payload = {
        "username": f"monitor{suffix}",
        "display_name": "Monitor Phase37",
        "email": f"monitor{suffix}@athron.edu",
        "password": USER_PASSWORD,
        "employee_code": f"MON-{suffix}",
        "title": "Docente",
        "department": "Ciencias",
        "specialties": ["matematica"],
        "max_students": 40,
    }
    response = await client.post("/api/v1/monitors", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


async def create_year(client: AsyncClient, headers: dict) -> dict:
    payload = {
        "year": 2030 + uuid4().int % 60,
        "name": unique("Academic Year"),
        "start_date": "2026-03-01",
        "end_date": "2026-12-20",
        "status": "planned",
    }
    response = await client.post("/api/v1/academic-years", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


async def create_section(client: AsyncClient, headers: dict, grade_id: str) -> dict:
    payload = {
        "grade_id": grade_id,
        "name": uuid4().hex[:4].upper(),
        "name_short": uuid4().hex[:2].upper(),
        "capacity": 30,
        "status": "active",
    }
    response = await client.post("/api/v1/sections", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


async def create_classroom(
    client: AsyncClient,
    headers: dict,
    *,
    year_id: str,
    grade_id: str,
    section_id: str | None = None,
    capacity: int | None = 20,
) -> dict:
    suffix = uuid4().hex[:8]
    payload = {
        "academic_year_id": year_id,
        "grade_id": grade_id,
        "section_id": section_id,
        "code": f"CLR-{suffix}",
        "display_name": f"Classroom {suffix}",
        "capacity": capacity,
        "capacity_source": "manual",
        "status": "active",
    }
    response = await client.post("/api/v1/classrooms", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


async def create_enrollment(
    client: AsyncClient,
    headers: dict,
    *,
    student_id: str,
    classroom_id: str,
    period_id: str | None = None,
    idempotency_key: str | None = None,
) -> dict:
    request_headers = dict(headers)
    if idempotency_key:
        request_headers["Idempotency-Key"] = idempotency_key
    payload = {
        "student_id": student_id,
        "classroom_id": classroom_id,
        "period_id": period_id,
        "status": "active",
    }
    response = await client.post(
        "/api/v1/enrollments",
        json=payload,
        headers=request_headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


async def structure(client: AsyncClient, headers: dict, *, capacity: int = 20):
    grades = await client.get("/api/v1/grades", headers=headers)
    assert grades.status_code == 200, grades.text
    grade = next(item for item in grades.json() if item["number"] == 4)

    year = await create_year(client, headers)
    period_response = await client.post(
        "/api/v1/academic-periods",
        json={
            "academic_year_id": year["id"],
            "name": unique("Period"),
            "period_type": "bimester",
            "start_date": "2026-03-01",
            "end_date": "2026-04-30",
            "status": "active",
            "sequence": 1,
        },
        headers=headers,
    )
    assert period_response.status_code == 201, period_response.text
    period = period_response.json()

    section = await create_section(client, headers, grade["id"])
    classroom = await create_classroom(
        client,
        headers,
        year_id=year["id"],
        grade_id=grade["id"],
        section_id=section["id"],
        capacity=capacity,
    )
    return year, period, grade, section, classroom


@pytest.mark.asyncio
async def test_academic_structure_and_institution_isolation(async_client: AsyncClient):
    admin = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    other = await login(async_client, ADMIN_TWO["email"], ADMIN_PASSWORD)

    year, period, grade, section, classroom = await structure(
        async_client,
        admin["headers"],
    )

    years = await async_client.get(
        "/api/v1/academic-years",
        params={"search": year["name"]},
        headers=admin["headers"],
    )
    assert years.status_code == 200, years.text
    assert years.json()["total"] == 1

    periods = await async_client.get(
        "/api/v1/academic-periods",
        params={"academic_year_id": year["id"]},
        headers=admin["headers"],
    )
    assert periods.status_code == 200, periods.text
    assert periods.json()["total"] == 1
    assert periods.json()["items"][0]["period_type"] == "bimester"

    sections = await async_client.get(
        "/api/v1/sections",
        params={"grade_id": grade["id"]},
        headers=admin["headers"],
    )
    assert sections.status_code == 200, sections.text
    assert any(item["id"] == section["id"] for item in sections.json()["items"])

    classrooms = await async_client.get(
        "/api/v1/classrooms",
        params={"academic_year_id": year["id"]},
        headers=admin["headers"],
    )
    assert classrooms.status_code == 200, classrooms.text
    assert classrooms.json()["total"] == 1

    detail = await async_client.get(
        f"/api/v1/classrooms/{classroom['id']}",
        headers=admin["headers"],
    )
    assert detail.status_code == 200, detail.text
    assert detail.json()["grade_name"] == grade["display_name"]
    assert detail.json()["section_name"] == section["name"]

    isolated_year = await async_client.get(
        f"/api/v1/academic-years/{year['id']}",
        headers=other["headers"],
    )
    assert isolated_year.status_code == 404

    isolated_classroom = await async_client.get(
        f"/api/v1/classrooms/{classroom['id']}",
        headers=other["headers"],
    )
    assert isolated_classroom.status_code == 404

    isolated_periods = await async_client.get(
        "/api/v1/academic-periods",
        params={"academic_year_id": year["id"]},
        headers=other["headers"],
    )
    assert isolated_periods.status_code == 200
    assert isolated_periods.json()["total"] == 0

    assert period["academic_year_id"] == year["id"]


@pytest.mark.asyncio
async def test_enrollment_capacity_idempotency_transfer_and_withdrawal(
    async_client: AsyncClient,
):
    admin = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    year, period, grade, _section, classroom = await structure(
        async_client,
        admin["headers"],
        capacity=1,
    )
    student_one = await create_student(async_client, admin["headers"])
    student_two = await create_student(async_client, admin["headers"])

    key = unique("enroll")
    first = await create_enrollment(
        async_client,
        admin["headers"],
        student_id=student_one["id"],
        classroom_id=classroom["id"],
        period_id=period["id"],
        idempotency_key=key,
    )
    replay = await create_enrollment(
        async_client,
        admin["headers"],
        student_id=student_one["id"],
        classroom_id=classroom["id"],
        period_id=period["id"],
        idempotency_key=key,
    )
    assert replay["id"] == first["id"]

    conflicting = await async_client.post(
        "/api/v1/enrollments",
        json={
            "student_id": student_two["id"],
            "classroom_id": classroom["id"],
            "status": "active",
        },
        headers={**admin["headers"], "Idempotency-Key": key},
    )
    assert conflicting.status_code == 409, conflicting.text

    full = await async_client.post(
        "/api/v1/enrollments",
        json={
            "student_id": student_two["id"],
            "classroom_id": classroom["id"],
            "status": "active",
        },
        headers=admin["headers"],
    )
    assert full.status_code == 409, full.text

    duplicate_student = await async_client.post(
        "/api/v1/enrollments",
        json={
            "student_id": student_one["id"],
            "classroom_id": classroom["id"],
            "status": "active",
        },
        headers=admin["headers"],
    )
    assert duplicate_student.status_code == 409, duplicate_student.text

    destination = await create_classroom(
        async_client,
        admin["headers"],
        year_id=year["id"],
        grade_id=grade["id"],
        capacity=10,
    )
    transferred = await async_client.post(
        f"/api/v1/enrollments/{first['id']}/transfer",
        json={
            "destination_classroom_id": destination["id"],
            "reason_code": "academic_reorganization",
            "notes": "Move to the second classroom",
        },
        headers={**admin["headers"], "Idempotency-Key": unique("transfer")},
    )
    assert transferred.status_code == 200, transferred.text
    destination_enrollment = transferred.json()
    assert destination_enrollment["classroom_id"] == destination["id"]

    source = await async_client.get(
        f"/api/v1/enrollments/{first['id']}",
        headers=admin["headers"],
    )
    assert source.status_code == 200, source.text
    assert source.json()["status"] == "transferred"

    movements = await async_client.get(
        "/api/v1/academic-movements",
        params={"student_id": student_one["id"]},
        headers=admin["headers"],
    )
    assert movements.status_code == 200, movements.text
    assert movements.json()["total"] == 2
    assert {item["movement_type"] for item in movements.json()["items"]} == {
        "enrollment",
        "transfer",
    }

    withdrawn = await async_client.post(
        f"/api/v1/enrollments/{destination_enrollment['id']}/withdraw",
        json={"reason_code": "family_request", "notes": "Family relocated"},
        headers=admin["headers"],
    )
    assert withdrawn.status_code == 200, withdrawn.text
    assert withdrawn.json()["status"] == "withdrawn"

    reenrolled = await create_enrollment(
        async_client,
        admin["headers"],
        student_id=student_one["id"],
        classroom_id=destination["id"],
        period_id=period["id"],
        idempotency_key=unique("reenroll"),
    )
    assert reenrolled["status"] == "active"

    completed = await async_client.post(
        f"/api/v1/enrollments/{reenrolled['id']}/complete",
        json={"reason_code": "year_end"},
        headers=admin["headers"],
    )
    assert completed.status_code == 200, completed.text
    assert completed.json()["status"] == "completed"

    other = await login(async_client, ADMIN_TWO["email"], ADMIN_PASSWORD)
    isolated = await async_client.get(
        "/api/v1/enrollments",
        params={"academic_year_id": year["id"]},
        headers=other["headers"],
    )
    assert isolated.status_code == 200
    assert isolated.json()["total"] == 0

    isolated_detail = await async_client.get(
        f"/api/v1/enrollments/{first['id']}",
        headers=other["headers"],
    )
    assert isolated_detail.status_code == 404


@pytest.mark.asyncio
async def test_teacher_assignment_monitor_and_student_scoping(
    async_client: AsyncClient,
):
    admin = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    _year, period, grade, _section, classroom = await structure(
        async_client,
        admin["headers"],
    )
    student = await create_student(async_client, admin["headers"])
    monitor = await create_monitor(async_client, admin["headers"])

    enrollment = await create_enrollment(
        async_client,
        admin["headers"],
        student_id=student["id"],
        classroom_id=classroom["id"],
        period_id=period["id"],
    )

    suffix = uuid4().hex[:8]
    async with AsyncSessionLocal() as session:
        course = Course(
            institution_id=admin["institution"]["id"],
            grade_id=grade["id"],
            code=f"MAT-{suffix}",
            name=f"Matematica {suffix}",
            status="active",
        )
        session.add(course)
        await session.commit()
        course_id = str(course.id)

    assignment_response = await async_client.post(
        "/api/v1/teacher-assignments",
        json={
            "monitor_id": monitor["id"],
            "classroom_id": classroom["id"],
            "course_id": course_id,
            "period_id": period["id"],
            "responsibility": "main",
            "status": "active",
            "start_date": "2026-03-01T00:00:00Z",
        },
        headers=admin["headers"],
    )
    assert assignment_response.status_code == 201, assignment_response.text
    assignment = assignment_response.json()
    assert assignment["monitor_display_name"] == monitor["display_name"]
    assert assignment["course_name"].startswith("Matematica")

    duplicate = await async_client.post(
        "/api/v1/teacher-assignments",
        json={
            "monitor_id": monitor["id"],
            "classroom_id": classroom["id"],
            "course_id": course_id,
            "period_id": period["id"],
            "responsibility": "main",
            "status": "active",
        },
        headers=admin["headers"],
    )
    assert duplicate.status_code == 409, duplicate.text

    monitor_login = await login(async_client, monitor["username"], USER_PASSWORD)
    own_classrooms = await async_client.get(
        "/api/v1/monitors/me/classrooms",
        headers=monitor_login["headers"],
    )
    assert own_classrooms.status_code == 200, own_classrooms.text
    assert [item["id"] for item in own_classrooms.json()] == [classroom["id"]]

    own_assignments = await async_client.get(
        "/api/v1/teacher-assignments",
        headers=monitor_login["headers"],
    )
    assert own_assignments.status_code == 200, own_assignments.text
    assert own_assignments.json()["total"] == 1

    monitor_students = await async_client.get(
        f"/api/v1/classrooms/{classroom['id']}/students",
        headers=monitor_login["headers"],
    )
    assert monitor_students.status_code == 200, monitor_students.text
    assert [item["student_id"] for item in monitor_students.json()] == [student["id"]]

    monitor_enrollments = await async_client.get(
        "/api/v1/enrollments",
        headers=monitor_login["headers"],
    )
    assert monitor_enrollments.status_code == 200, monitor_enrollments.text
    assert monitor_enrollments.json()["total"] == 1

    student_login = await login(async_client, student["username"], USER_PASSWORD)
    own_enrollments = await async_client.get(
        "/api/v1/enrollments",
        headers=student_login["headers"],
    )
    assert own_enrollments.status_code == 200, own_enrollments.text
    assert [item["id"] for item in own_enrollments.json()["items"]] == [enrollment["id"]]

    forbidden = await async_client.get(
        "/api/v1/classrooms",
        headers=student_login["headers"],
    )
    assert forbidden.status_code == 403

    revoked = await async_client.post(
        f"/api/v1/teacher-assignments/{assignment['id']}/revoke",
        headers=admin["headers"],
    )
    assert revoked.status_code == 200, revoked.text
    assert revoked.json()["status"] == "revoked"

    after_revoke = await async_client.get(
        "/api/v1/monitors/me/classrooms",
        headers=monitor_login["headers"],
    )
    assert after_revoke.status_code == 200
    assert after_revoke.json() == []
