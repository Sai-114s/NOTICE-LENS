import unittest
from eligibility_engine.models import NoticeCriteria, StudentProfile
from eligibility_engine.eligibility import evaluate_eligibility

class TestEligibilityEngine(unittest.TestCase):
    def setUp(self):
        self.criteria = NoticeCriteria(
            min_cgpa=7.5,
            eligible_branches=["CSE", "ECE", "IT"],
            eligible_years=[2024, 2025],
            max_active_backlogs=0
        )

    def test_eligible_student(self):
        student = StudentProfile(
            student_id="S001",
            cgpa=8.2,
            branch="CSE",
            year=2024,
            active_backlogs=0
        )
        result = evaluate_eligibility(self.criteria, student)
        self.assertEqual(result.status, "eligible")
        self.assertEqual(len(result.reasons), 0)

    def test_ineligible_cgpa(self):
        student = StudentProfile(
            student_id="S002",
            cgpa=7.0,
            branch="CSE",
            year=2024,
            active_backlogs=0
        )
        result = evaluate_eligibility(self.criteria, student)
        self.assertEqual(result.status, "not_eligible")
        self.assertTrue(any("CGPA" in reason for reason in result.reasons))

    def test_ineligible_branch_and_backlogs(self):
        student = StudentProfile(
            student_id="S003",
            cgpa=8.0,
            branch="MECH",
            year=2025,
            active_backlogs=2
        )
        result = evaluate_eligibility(self.criteria, student)
        self.assertEqual(result.status, "not_eligible")
        self.assertTrue(any("Branch" in reason for reason in result.reasons))
        self.assertTrue(any("backlogs" in reason for reason in result.reasons))

if __name__ == '__main__':
    unittest.main()
