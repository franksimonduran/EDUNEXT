"""No DB fixtures or application settings. Requires installed Pydantic only."""

import json
import unittest
from uuid import uuid4

from pydantic import ValidationError
from app.schemas.sync import SyncBatch


class SyncContractTests(unittest.TestCase):
    def payload(self):
        return {"expected_account_id": str(uuid4()), "expected_institution_id": str(uuid4()),
                "operations": [{"client_operation_id": str(uuid4()), "operation_type": "lesson.progress.complete",
                                "schema_version": 1, "resource_id": str(uuid4()), "lesson_version_id": str(uuid4())}]}

    def parse(self, payload):
        return SyncBatch.model_validate_json(json.dumps(payload))

    def test_uuid_strings_valid_over_http_json(self):
        self.assertEqual(len(self.parse(self.payload()).operations), 1)

    def test_privileged_operations_rejected(self):
        for code in ("academic_record.update", "user.role.change", "enrollment.create", "content.publish", "assessment_grade.edit"):
            data = self.payload()
            data["operations"][0]["operation_type"] = code
            with self.subTest(code=code), self.assertRaises(ValidationError):
                self.parse(data)

    def test_identity_cannot_be_granted_by_payload(self):
        data = self.payload()
        data["institution_id"] = str(uuid4())
        with self.assertRaises(ValidationError):
            self.parse(data)
        data = self.payload()
        data["operations"][0]["achievement_level"] = "AD"
        with self.assertRaises(ValidationError):
            self.parse(data)

    def test_duplicates_limits_and_schema_version(self):
        for count in (0, 26, 2):
            data = self.payload()
            data["operations"] *= count
            with self.subTest(count=count), self.assertRaises(ValidationError):
                self.parse(data)
        for version in (True, "1", 2):
            data = self.payload()
            data["operations"][0]["schema_version"] = version
            with self.subTest(version=version), self.assertRaises(ValidationError):
                self.parse(data)


if __name__ == "__main__":
    unittest.main()
