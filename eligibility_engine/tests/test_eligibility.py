import unittest
from eligibility_engine.models import NoticeCriteria, StudentProfile
from eligibility_engine.eligibility import evaluate_eligibility

class TestEligibilityEngine(unittest.TestCase):
    def setUp(self):
        self.default_student = StudentProfile(
            student_id="student_1",
            branch="CSE",
            year=4,
            cgpa=8.5,
            active_backlogs=0,
            tenth_percentage=90.0,
            twelfth_percentage=92.0,
            degree="B.Tech"
        )
        self.default_criteria = NoticeCriteria()

    def test_1_all_criteria_met(self):
        criteria = NoticeCriteria(
            eligible_branches=["CSE", "IT"],
            eligible_years=[4],
            min_cgpa=8.0,
            max_active_backlogs=1,
            min_tenth_percentage=85.0,
            min_twelfth_percentage=85.0,
            eligible_degrees=["B.Tech"]
        )
        result = evaluate_eligibility(criteria, self.default_student)
        self.assertEqual(result.status, "eligible")

    def test_2_invalid_branch(self):
        criteria = NoticeCriteria(eligible_branches=["MECH", "CIVIL"])
        result = evaluate_eligibility(criteria, self.default_student)
        self.assertEqual(result.status, "not_eligible")
        self.assertIn("Branch 'CSE' is not eligible. Allowed: MECH, CIVIL", result.reasons)

    def test_3_missing_branch_needs_info(self):
        criteria = NoticeCriteria(eligible_branches=["CSE"])
        student = StudentProfile(student_id="student_2", year=4, cgpa=8.5, active_backlogs=0, degree="B.Tech")
        result = evaluate_eligibility(criteria, student)
        self.assertEqual(result.status, "needs_information")
        self.assertIn("Branch", result.missing_information)

    def test_4_invalid_year(self):
        criteria = NoticeCriteria(eligible_years=[3])
        result = evaluate_eligibility(criteria, self.default_student)
        self.assertEqual(result.status, "not_eligible")
        self.assertTrue(any("Year '4' is not eligible" in reason for reason in result.reasons))

    def test_5_missing_year_needs_info(self):
        criteria = NoticeCriteria(eligible_years=[4])
        student = StudentProfile(student_id="student_2", branch="CSE", cgpa=8.5, active_backlogs=0, degree="B.Tech")
        result = evaluate_eligibility(criteria, student)
        self.assertEqual(result.status, "needs_information")
        self.assertIn("Year", result.missing_information)

    def test_6_invalid_cgpa(self):
        criteria = NoticeCriteria(min_cgpa=9.0)
        result = evaluate_eligibility(criteria, self.default_student)
        self.assertEqual(result.status, "not_eligible")
        self.assertTrue(any("CGPA 8.5 is below minimum required 9.0" in reason for reason in result.reasons))

    def test_7_missing_cgpa_needs_info(self):
        criteria = NoticeCriteria(min_cgpa=8.0)
        student = StudentProfile(student_id="student_2", branch="CSE", year=4, active_backlogs=0, degree="B.Tech")
        result = evaluate_eligibility(criteria, student)
        self.assertEqual(result.status, "needs_information")
        self.assertIn("CGPA", result.missing_information)

    def test_8_invalid_backlogs(self):
        criteria = NoticeCriteria(max_active_backlogs=0)
        student = StudentProfile(student_id="student_2", branch="CSE", year=4, cgpa=8.5, active_backlogs=1, degree="B.Tech")
        result = evaluate_eligibility(criteria, student)
        self.assertEqual(result.status, "not_eligible")
        self.assertTrue(any("exceeds maximum allowed 0" in reason for reason in result.reasons))

    def test_9_missing_backlogs_needs_info(self):
        criteria = NoticeCriteria(max_active_backlogs=1)
        student = StudentProfile(student_id="student_2", branch="CSE", year=4, cgpa=8.5, degree="B.Tech")
        result = evaluate_eligibility(criteria, student)
        self.assertEqual(result.status, "needs_information")
        self.assertIn("Active Backlogs", result.missing_information)

    def test_10_invalid_tenth_percentage(self):
        criteria = NoticeCriteria(min_tenth_percentage=95.0)
        result = evaluate_eligibility(criteria, self.default_student)
        self.assertEqual(result.status, "not_eligible")

    def test_11_missing_tenth_needs_info(self):
        criteria = NoticeCriteria(min_tenth_percentage=80.0)
        student = StudentProfile(student_id="s", branch="CSE", year=4, cgpa=8.5, active_backlogs=0, twelfth_percentage=92.0, degree="B.Tech")
        result = evaluate_eligibility(criteria, student)
        self.assertEqual(result.status, "needs_information")

    def test_12_invalid_twelfth_percentage(self):
        criteria = NoticeCriteria(min_twelfth_percentage=95.0)
        result = evaluate_eligibility(criteria, self.default_student)
        self.assertEqual(result.status, "not_eligible")

    def test_13_missing_twelfth_needs_info(self):
        criteria = NoticeCriteria(min_twelfth_percentage=80.0)
        student = StudentProfile(student_id="s", branch="CSE", year=4, cgpa=8.5, active_backlogs=0, tenth_percentage=90.0, degree="B.Tech")
        result = evaluate_eligibility(criteria, student)
        self.assertEqual(result.status, "needs_information")

    def test_14_degree_checks(self):
        criteria = NoticeCriteria(eligible_degrees=["M.Tech", "MBA"])
        result = evaluate_eligibility(criteria, self.default_student)
        self.assertEqual(result.status, "not_eligible")
        
        student = StudentProfile(student_id="s", branch="CSE", year=4, cgpa=8.5, active_backlogs=0, tenth_percentage=90.0, twelfth_percentage=92.0)
        result = evaluate_eligibility(criteria, student)
        self.assertEqual(result.status, "needs_information")

if __name__ == '__main__':
    unittest.main()
