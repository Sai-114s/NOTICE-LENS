import unittest

from agent.notice_agent import NoticeAgent, NoticeExtractionError, empty_notice, parse_json_output, validate_structured_notice


class TestNoticeAgent(unittest.TestCase):
    def test_normal_notice_in_demo_mode(self):
        result = NoticeAgent("DEMO").extract_structured_data(
            "Campus Placement Drive. Branches: CSE, ECE and IT. Minimum CGPA 7.5. No active backlogs allowed. Apply through the placement portal before 23 September."
        )
        self.assertEqual(result["type"], "Placement")
        self.assertEqual(result["min_cgpa"], 7.5)
        self.assertEqual(result["branches"], ["CSE", "ECE", "IT"])
        self.assertEqual(result["max_active_backlogs"], 0)
        self.assertEqual(result["application_method"], "Apply through the placement portal before 23 September")

    def test_incomplete_notice_uses_nulls_and_empty_arrays(self):
        result = NoticeAgent("DEMO").extract_structured_data(
            "The department will share an announcement soon."
        )
        self.assertIsNone(result["title"])
        self.assertIsNone(result["min_cgpa"])
        self.assertEqual(result["branches"], [])
        self.assertEqual(result["documents"], [])

    def test_ambiguous_notice_does_not_invent_requirements(self):
        result = NoticeAgent("DEMO").extract_structured_data(
            "Students may be considered for an opportunity. Contact the office for details."
        )
        self.assertIsNone(result["min_cgpa"])
        self.assertIsNone(result["max_active_backlogs"])
        self.assertEqual(result["years"], [])
        self.assertEqual(result["application_url"], None)

    def test_malformed_structured_output_is_rejected(self):
        with self.assertRaises(NoticeExtractionError):
            validate_structured_notice({"title": "Only title"})
        with self.assertRaises(NoticeExtractionError):
            validate_structured_notice(dict(empty_notice(), unexpected="nope"))

    def test_malformed_json_is_rejected(self):
        with self.assertRaises(NoticeExtractionError):
            parse_json_output("{not valid json")

    def test_malformed_agent_output_is_rejected_before_application(self):
        malformed = parse_json_output('{"title": "Wrong types"}')
        with self.assertRaises(NoticeExtractionError):
            validate_structured_notice(malformed)


if __name__ == "__main__":
    unittest.main()
