"""Standard-library tests: no configured database, secrets or destructive fixtures."""

import unittest

from app.rules.insight_rules import RULES, evaluate, insight_id


class InsightRuleTests(unittest.TestCase):
    def test_positive_and_no_condition(self):
        for rule in RULES[:2]:
            self.assertEqual(evaluate(rule, 2)["observed_value"], 2)
            self.assertIsNone(evaluate(rule, 0))

    def test_zero_published_lessons(self):
        self.assertEqual(evaluate(RULES[2], 0)["data_status"], "available")
        self.assertIsNone(evaluate(RULES[2], 1))

    def test_invalid_counts(self):
        for rule in RULES:
            for value in (None, True, False, -1, 1.5, "1", "__import__('os')", "SELECT *"):
                with self.subTest(rule=rule.code, value=value):
                    result = evaluate(rule, value)
                    self.assertEqual(result["data_status"], "insufficient_data")
                    self.assertIsNone(result["suggestion"])

    def test_reproducible_and_versioned(self):
        for rule in RULES:
            self.assertEqual(evaluate(rule, 0), evaluate(rule, 0))
            self.assertEqual(rule.version, 1)
        self.assertEqual(len({r.code for r in RULES}), len(RULES))

    def test_identity_separates_context_and_changed_evidence(self):
        def key(institution="a", value=1, filters=None):
            return insight_id(institution, RULES[0], filters or {}, "task", 1, value)
        self.assertEqual(key(), key())
        self.assertNotEqual(key(), key("b"))
        self.assertNotEqual(key(), key(value=2))
        self.assertNotEqual(key(), key(filters={"academic_period_id": "period"}))


if __name__ == "__main__":
    unittest.main()
