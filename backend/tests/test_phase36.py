"""Integration tests for authentication and Phase 36 people APIs."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.core.config import settings
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
        "display_name": "Student Test",
        "email": f"student{suffix}@athron.edu",
        "password": USER_PASSWORD,
        "student_code": f"STU-{suffix}",
        "grade": 5,
        "section": "A",
        "birth_date": "2014-05-20",
        "guardian_name": "Guardian Test",
        "guardian_phone": "+51999999999",
    }
    payload.update(overrides)
    response = await client.post("/api/v1/students", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_login_me_and_logout(async_client: AsyncClient):
    login_payload = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    headers = login_payload["headers"]

    assert login_payload["user"]["roles"] == ["ADMIN"]
    assert login_payload["institution"]["code"] == "INST-ONE"
    assert async_client.cookies.get(settings.REFRESH_COOKIE_NAME)
    assert async_client.cookies.get(settings.CSRF_COOKIE_NAME)

    me = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200, me.text
    assert me.json()["user"]["email"] == ADMIN_ONE["email"]
    assert "users.read_institution" in me.json()["permissions"]

    denied = await async_client.post("/api/v1/auth/logout", headers={"Authorization": headers["Authorization"]})
    assert denied.status_code == 403

    logout = await async_client.post("/api/v1/auth/logout", headers=headers)
    assert logout.status_code == 200, logout.text

    after = await async_client.get("/api/v1/auth/me", headers=headers)
    assert after.status_code == 401


@pytest.mark.asyncio
async def test_refresh_requires_csrf_and_rotates(async_client: AsyncClient):
    login_payload = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)

    missing = await async_client.post("/api/v1/auth/refresh")
    assert missing.status_code == 403

    wrong = await async_client.post(
        "/api/v1/auth/refresh",
        headers={CSRF_HEADER: "invalid-token"},
    )
    assert wrong.status_code == 403

    refreshed = await async_client.post(
        "/api/v1/auth/refresh",
        headers={CSRF_HEADER: login_payload["csrf_token"]},
    )
    assert refreshed.status_code == 200, refreshed.text
    new_payload = refreshed.json()
    assert new_payload["access_token"] != login_payload["access_token"]
    assert new_payload["csrf_token"] != login_payload["csrf_token"]

    rotated_again = await async_client.post(
        "/api/v1/auth/refresh",
        headers={CSRF_HEADER: new_payload["csrf_token"]},
    )
    assert rotated_again.status_code == 200, rotated_again.text


@pytest.mark.asyncio
async def test_refresh_token_reuse_revokes_session(async_client: AsyncClient):
    login_payload = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    old_refresh = login_payload["headers"]  # keep access token for checks

    old_refresh_cookie = async_client.cookies.get(settings.REFRESH_COOKIE_NAME)
    assert old_refresh_cookie

    refreshed = await async_client.post(
        "/api/v1/auth/refresh",
        headers={CSRF_HEADER: login_payload["csrf_token"]},
    )
    assert refreshed.status_code == 200, refreshed.text
    new_csrf_token = refreshed.json()["csrf_token"]
    new_csrf_cookie = async_client.cookies.get(settings.CSRF_COOKIE_NAME)

    reuse = await async_client.post(
        "/api/v1/auth/refresh",
        headers={
            CSRF_HEADER: new_csrf_token,
            "Cookie": (
                f"{settings.REFRESH_COOKIE_NAME}={old_refresh_cookie}; "
                f"{settings.CSRF_COOKIE_NAME}={new_csrf_cookie}"
            ),
        },
    )
    assert reuse.status_code == 401, reuse.text

    me = await async_client.get("/api/v1/auth/me", headers=old_refresh)
    assert me.status_code == 401


@pytest.mark.asyncio
async def test_institution_isolation(async_client: AsyncClient):
    admin_one = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    student = await create_student(async_client, admin_one["headers"])

    admin_two = await login(async_client, ADMIN_TWO["email"], ADMIN_PASSWORD)

    listing = await async_client.get(
        "/api/v1/students",
        params={"search": student["student_code"]},
        headers=admin_two["headers"],
    )
    assert listing.status_code == 200, listing.text
    assert listing.json()["total"] == 0

    direct = await async_client.get(
        f"/api/v1/students/{student['id']}",
        headers=admin_two["headers"],
    )
    assert direct.status_code == 404

    institution_id = admin_one["institution"]["id"]
    forbidden = await async_client.get(
        f"/api/v1/institutions/{institution_id}",
        headers=admin_two["headers"],
    )
    assert forbidden.status_code == 403


@pytest.mark.asyncio
async def test_student_list_hides_guardian_and_detail_includes_it(async_client: AsyncClient):
    admin = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    student = await create_student(
        async_client,
        admin["headers"],
        guardian_name="Guardian Private",
        guardian_phone="+51888888888",
    )

    listing = await async_client.get(
        "/api/v1/students",
        params={"search": student["student_code"]},
        headers=admin["headers"],
    )
    assert listing.status_code == 200, listing.text
    item = listing.json()["items"][0]
    assert "guardian_name" not in item
    assert "guardian_phone" not in item
    assert "birth_date" not in item

    detail = await async_client.get(
        f"/api/v1/students/{student['id']}",
        headers=admin["headers"],
    )
    assert detail.status_code == 200, detail.text
    assert detail.json()["guardian_name"] == "Guardian Private"
    assert detail.json()["birth_date"] == "2014-05-20"


@pytest.mark.asyncio
async def test_student_role_cannot_access_people_admin(async_client: AsyncClient):
    admin = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    student = await create_student(async_client, admin["headers"])

    student_login = await login(async_client, student["username"], USER_PASSWORD)
    forbidden = await async_client.get("/api/v1/users", headers=student_login["headers"])
    assert forbidden.status_code == 403

    own_me = await async_client.get("/api/v1/auth/me", headers=student_login["headers"])
    assert own_me.status_code == 200
    assert own_me.json()["roles"] == ["STUDENT"]


@pytest.mark.asyncio
async def test_last_active_admin_membership_is_protected(async_client: AsyncClient):
    admin = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)

    me = await async_client.get("/api/v1/auth/me", headers=admin["headers"])
    user_id = me.json()["user"]["id"]

    memberships = await async_client.get(
        "/api/v1/memberships",
        params={"user_id": user_id, "role_code": "ADMIN"},
        headers=admin["headers"],
    )
    assert memberships.status_code == 200, memberships.text
    membership = memberships.json()["items"][0]

    deactivate = await async_client.patch(
        f"/api/v1/memberships/{membership['id']}",
        json={"is_active": False},
        headers=admin["headers"],
    )
    assert deactivate.status_code == 409, deactivate.text

    self_deactivate = await async_client.delete(
        f"/api/v1/users/{user_id}",
        headers=admin["headers"],
    )
    assert self_deactivate.status_code == 403, self_deactivate.text


@pytest.mark.asyncio
async def test_people_crud_and_pagination(async_client: AsyncClient):
    admin = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    suffix = uuid4().hex[:8]

    monitor_payload = {
        "username": f"monitor{suffix}",
        "display_name": "Monitor Test",
        "email": f"monitor{suffix}@athron.edu",
        "password": USER_PASSWORD,
        "employee_code": f"MON-{suffix}",
        "title": "Docente",
        "department": "Ciencias",
        "specialties": ["matematica"],
        "max_students": 40,
    }
    created = await async_client.post(
        "/api/v1/monitors",
        json=monitor_payload,
        headers=admin["headers"],
    )
    assert created.status_code == 201, created.text
    monitor = created.json()
    assert monitor["employee_code"] == monitor_payload["employee_code"]
    assert monitor["specialties"] == ["matematica"]

    listing = await async_client.get(
        "/api/v1/monitors",
        params={"search": monitor_payload["employee_code"], "page_size": 1},
        headers=admin["headers"],
    )
    assert listing.status_code == 200, listing.text
    assert listing.json()["total"] == 1
    assert listing.json()["pages"] == 1

    updated = await async_client.patch(
        f"/api/v1/monitors/{monitor['id']}",
        json={"department": "Matematica", "max_students": 25},
        headers=admin["headers"],
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["department"] == "Matematica"
    assert updated.json()["max_students"] == 25

    deactivated = await async_client.delete(
        f"/api/v1/monitors/{monitor['id']}",
        headers=admin["headers"],
    )
    assert deactivated.status_code == 204, deactivated.text

    after = await async_client.get(
        f"/api/v1/monitors/{monitor['id']}",
        headers=admin["headers"],
    )
    assert after.status_code == 200
    assert after.json()["status"] == "inactive"


@pytest.mark.asyncio
async def test_create_user_and_duplicate_conflict(async_client: AsyncClient):
    admin = await login(async_client, ADMIN_ONE["email"], ADMIN_PASSWORD)
    suffix = uuid4().hex[:8]
    payload = {
        "username": f"admin{suffix}",
        "display_name": "Second Admin",
        "email": f"admin{suffix}@athron.edu",
        "password": USER_PASSWORD,
        "role_code": "ADMIN",
    }

    created = await async_client.post("/api/v1/users", json=payload, headers=admin["headers"])
    assert created.status_code == 201, created.text
    assert created.json()["roles"] == ["ADMIN"]

    duplicate = await async_client.post("/api/v1/users", json=payload, headers=admin["headers"])
    assert duplicate.status_code == 409, duplicate.text