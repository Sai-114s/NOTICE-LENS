from .models import NoticeCriteria, StudentProfile, EligibilityResult

def evaluate_eligibility(criteria: NoticeCriteria, student: StudentProfile) -> EligibilityResult:
    reasons = []
    missing_information = []
    action_items = []

    # Branch
    if criteria.eligible_branches is not None:
        if student.branch is None:
            missing_information.append("Branch")
            action_items.append("Update branch in profile")
        elif student.branch not in criteria.eligible_branches:
            reasons.append(f"Branch '{student.branch}' is not eligible. Allowed: {', '.join(criteria.eligible_branches)}")

    # Year
    if criteria.eligible_years is not None:
        if student.year is None:
            missing_information.append("Year")
            action_items.append("Update year in profile")
        elif student.year not in criteria.eligible_years:
            reasons.append(f"Year '{student.year}' is not eligible. Allowed: {', '.join(map(str, criteria.eligible_years))}")

    # Degree
    if criteria.eligible_degrees is not None:
        if student.degree is None:
            missing_information.append("Degree")
            action_items.append("Update degree in profile")
        elif student.degree not in criteria.eligible_degrees:
            reasons.append(f"Degree '{student.degree}' is not eligible. Allowed: {', '.join(criteria.eligible_degrees)}")

    # CGPA
    if criteria.min_cgpa is not None:
        if student.cgpa is None:
            missing_information.append("CGPA")
            action_items.append("Update CGPA in profile")
        elif student.cgpa < criteria.min_cgpa:
            reasons.append(f"CGPA {student.cgpa} is below minimum required {criteria.min_cgpa}")

    # Backlogs
    if criteria.max_active_backlogs is not None:
        if student.active_backlogs is None:
            missing_information.append("Active Backlogs")
            action_items.append("Update active backlogs in profile")
        elif student.active_backlogs > criteria.max_active_backlogs:
            reasons.append(f"Active backlogs {student.active_backlogs} exceeds maximum allowed {criteria.max_active_backlogs}")

    # 10th Percentage
    if criteria.min_tenth_percentage is not None:
        if student.tenth_percentage is None:
            missing_information.append("10th Percentage")
            action_items.append("Update 10th percentage in profile")
        elif student.tenth_percentage < criteria.min_tenth_percentage:
            reasons.append(f"10th percentage {student.tenth_percentage} is below minimum required {criteria.min_tenth_percentage}")

    # 12th Percentage
    if criteria.min_twelfth_percentage is not None:
        if student.twelfth_percentage is None:
            missing_information.append("12th Percentage")
            action_items.append("Update 12th percentage in profile")
        elif student.twelfth_percentage < criteria.min_twelfth_percentage:
            reasons.append(f"12th percentage {student.twelfth_percentage} is below minimum required {criteria.min_twelfth_percentage}")

    # Determine final status
    if len(reasons) > 0:
        status = "not_eligible"
    elif len(missing_information) > 0:
        status = "needs_information"
    else:
        status = "eligible"

    return EligibilityResult(
        status=status,
        reasons=reasons,
        missing_information=missing_information,
        action_items=action_items
    )
