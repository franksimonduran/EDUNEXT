"""Non-destructive unit checks; run with unittest, not destructive pytest fixtures.

No real database is opened. PostgreSQL and HTTP authorization integration remain required.
"""
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

from app.core.config import Settings
from app.core.exceptions import NotFoundError
from app.schemas.permission import Permissions
from app.services.lesson_service import LessonService
from app.services.unit_service import UnitService
from app.services.authorization_service import AuthorizationService
from app.storage.resource_validation import detect_file_type, validate_resource_file
from app.db.models import ResourceType
from unittest.mock import patch


class ConfigurationSecurity(unittest.TestCase):
    def test_unknown_file_rejected_without_optional_sniffer(self):
        with patch("app.storage.resource_validation.magic", None):
            self.assertFalse(validate_resource_file(b"unrecognized", "test.png", ResourceType.IMAGE)[0])

    def test_riff_discriminator(self):
        self.assertEqual(detect_file_type(b"RIFF0000WAVEdata")[0], ResourceType.AUDIO)
        self.assertEqual(detect_file_type(b"RIFF0000WEBPdata")[0], ResourceType.IMAGE)
        self.assertIsNone(detect_file_type(b"RIFF0000FAKEdata")[0])

    def test_rejects_credentialed_wildcard(self):
        with self.assertRaises(ValueError):
            Settings(_env_file=None, CORS_ORIGINS="*")

    def test_rejects_unsafe_production(self):
        with self.assertRaises(ValueError):
            Settings(_env_file=None, APP_ENV="production", DEBUG=True, COOKIE_SECURE=False)


class ContentIsolation(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.context = SimpleNamespace(
            user_id=uuid4(), institution_id=uuid4(), permissions=[Permissions.COURSES_READ]
        )

    async def test_lesson_read_rejects_foreign_parent(self):
        service = LessonService(AsyncMock())
        lesson = SimpleNamespace(unit_id=str(uuid4()))
        unit = SimpleNamespace(course_id=str(uuid4()))
        service.repository.get_lesson = AsyncMock(return_value=lesson)
        service.unit_repo.get_unit = AsyncMock(return_value=unit)
        service.course_repo.get_course = AsyncMock(side_effect=NotFoundError("Course not found"))
        with self.assertRaises(NotFoundError):
            await service.get_lesson(self.context, uuid4())
        service.course_repo.get_course.assert_awaited_once_with(self.context.institution_id, unittest.mock.ANY)

    async def test_unit_read_rejects_foreign_parent(self):
        service = UnitService(AsyncMock())
        service.repository.get_unit = AsyncMock(return_value=SimpleNamespace(course_id=str(uuid4())))
        service.course_repo.get_course = AsyncMock(side_effect=NotFoundError("Course not found"))
        with self.assertRaises(NotFoundError):
            await service.get_unit(self.context, uuid4())

    async def test_generic_resource_helper_fails_closed(self):
        service = AuthorizationService(AsyncMock())
        service.has_permission = AsyncMock(return_value=True)
        self.assertFalse(await service.can_access_resource(uuid4(), uuid4(), "lessons", uuid4(), "read"))


if __name__ == "__main__":
    unittest.main()
