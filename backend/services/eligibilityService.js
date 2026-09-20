const { evaluateEligibility } = require('../utils/engineBridge');
const { parseDeadline, getOrdinal } = require('../utils/deadline');

async function evaluateNoticeForStudent(notice, student) {
    const criteria = notice.criteria || {};
    const minCgpa = criteria.min_cgpa || 0;
    const allowedBranches = criteria.allowed_branches || criteria.eligible_branches || [];
    const allowedYears = criteria.allowed_years || criteria.eligible_years || [];
    const maxBacklogs = criteria.max_backlogs !== undefined ? criteria.max_backlogs : 99;

    const pyCriteria = {
        min_cgpa: minCgpa > 0 ? minCgpa : null,
        eligible_branches: allowedBranches.length > 0 ? allowedBranches : null,
        eligible_years: allowedYears.length > 0 ? allowedYears : null,
        max_active_backlogs: maxBacklogs < 99 ? maxBacklogs : null
    };

    const pyStudent = {
        student_id: student.id || "student-eval",
        cgpa: (student.cgpa !== null && student.cgpa !== undefined) ? Number(student.cgpa) : null,
        branch: student.branch || null,
        year: (student.year !== null && student.year !== undefined) ? Number(student.year) : null,
        active_backlogs: (student.active_backlogs !== null && student.active_backlogs !== undefined) ? Number(student.active_backlogs) : null
    };

    const engineResult = await evaluateEligibility(pyCriteria, pyStudent);

    const isEligible = engineResult.status === 'eligible';
    const needsInfo = engineResult.status === 'needs_information';

    // 1. Primary Status Card
    let personalizedStatus;
    let statusCategory;
    let actionIndicator;

    if (isEligible) {
        personalizedStatus = "YOU ARE ELIGIBLE";
        statusCategory = "eligible";
        actionIndicator = "Apply on Portal";
    } else if (needsInfo) {
        personalizedStatus = "ELIGIBILITY NEEDS MORE INFORMATION";
        statusCategory = "needs-info";
        actionIndicator = "Update Academic Records";
    } else {
        personalizedStatus = "YOU ARE NOT ELIGIBLE";
        statusCategory = "not-eligible";
        actionIndicator = "Requirements Not Met";
    }

    // 2. Requirement-by-requirement results
    const requirements = [];

    // Branch Requirement
    if (allowedBranches.length > 0) {
        if (!student.branch) {
            requirements.push({
                name: "Branch",
                status: "missing",
                detail: "Please specify your branch in student profile."
            });
        } else {
            const studentBranchUpper = student.branch.trim().toUpperCase();
            const allowedUpper = allowedBranches.map(b => String(b).trim().toUpperCase());
            const alliedBranches = new Set(['CSM', 'AIDS', 'AIML', 'AI&DS', 'CSD', 'IT', 'CSE', 'ALLIED']);
            const hasAlliedAllowed = allowedUpper.some(b => b === 'ALLIED' || b === 'ALLIED BRANCHES' || b.includes('ALLIED'));
            const isBranchAccepted = allowedBranches.includes(student.branch) || allowedUpper.includes(studentBranchUpper) || (hasAlliedAllowed && alliedBranches.has(studentBranchUpper));

            if (isBranchAccepted) {
                requirements.push({
                    name: "Branch",
                    status: "pass",
                    detail: `${student.branch} accepted`
                });
            } else {
                requirements.push({
                    name: "Branch",
                    status: "fail",
                    detail: `${student.branch} is not among the eligible branches.`
                });
            }
        }
    } else {
        requirements.push({
            name: "Branch",
            status: "pass",
            detail: `${student.branch || 'All engineering branches'} accepted`
        });
    }

    // Year Requirement
    if (allowedYears.length > 0) {
        if (!student.year) {
            requirements.push({
                name: "Year",
                status: "missing",
                detail: "Please specify your current academic year."
            });
        } else if (allowedYears.includes(Number(student.year))) {
            requirements.push({
                name: "Year",
                status: "pass",
                detail: `${student.year}${getOrdinal(student.year)} year accepted`
            });
        } else {
            requirements.push({
                name: "Year",
                status: "fail",
                detail: `${student.year}${getOrdinal(student.year)} year is not eligible (Allowed: ${allowedYears.map(y => `${y}${getOrdinal(y)}`).join(', ')})`
            });
        }
    } else {
        requirements.push({
            name: "Year",
            status: "pass",
            detail: `${student.year ? `${student.year}${getOrdinal(student.year)} year` : 'All academic years'} accepted`
        });
    }

    // CGPA Requirement
    if (minCgpa > 0) {
        if (student.cgpa === null || student.cgpa === undefined) {
            requirements.push({
                name: "CGPA",
                status: "missing",
                detail: "Please record your official college CGPA."
            });
        } else if (Number(student.cgpa) >= minCgpa) {
            requirements.push({
                name: "CGPA",
                status: "pass",
                detail: `${student.cgpa} ≥ ${minCgpa}`
            });
        } else {
            requirements.push({
                name: "CGPA",
                status: "fail",
                detail: `${student.cgpa} < ${minCgpa} minimum requirement`
            });
        }
    } else {
        requirements.push({
            name: "CGPA",
            status: "pass",
            detail: "No minimum CGPA cutoff"
        });
    }

    // Backlogs Requirement
    if (maxBacklogs < 99) {
        if (student.active_backlogs === null || student.active_backlogs === undefined) {
            requirements.push({
                name: "Backlogs",
                status: "missing",
                detail: "Please update your active backlog count."
            });
        } else if (Number(student.active_backlogs) <= maxBacklogs) {
            requirements.push({
                name: "Backlogs",
                status: "pass",
                detail: `${student.active_backlogs} ≤ ${maxBacklogs}`
            });
        } else {
            requirements.push({
                name: "Backlogs",
                status: "fail",
                detail: `${student.active_backlogs} active backlogs exceeds limit of ${maxBacklogs}`
            });
        }
    } else {
        requirements.push({
            name: "Backlogs",
            status: "pass",
            detail: "No backlog restrictions"
        });
    }

    // 3. Expandable "Why am I seeing this?" breakdown
    const whyReasons = [];
    const branchReq = requirements.find(r => r.name === 'Branch');
    if (branchReq) {
        whyReasons.push({
            label: branchReq.status === 'pass' ? "Branch matches" : (branchReq.status === 'missing' ? "Branch verification pending" : "Branch does not match"),
            passed: branchReq.status === 'pass',
            missing: branchReq.status === 'missing'
        });
    }
    const yearReq = requirements.find(r => r.name === 'Year');
    if (yearReq) {
        whyReasons.push({
            label: yearReq.status === 'pass' ? "Year matches" : (yearReq.status === 'missing' ? "Year verification pending" : "Year does not match"),
            passed: yearReq.status === 'pass',
            missing: yearReq.status === 'missing'
        });
    }
    const cgpaReq = requirements.find(r => r.name === 'CGPA');
    if (cgpaReq) {
        whyReasons.push({
            label: cgpaReq.status === 'pass' ? "CGPA matches" : (cgpaReq.status === 'missing' ? "CGPA record pending" : "CGPA below requirement"),
            passed: cgpaReq.status === 'pass',
            missing: cgpaReq.status === 'missing'
        });
    }
    // Relative deadline reason
    if (notice.deadlineDays !== undefined) {
        whyReasons.push({
            label: notice.deadlineDays <= 7 ? "Deadline is approaching" : `Deadline in ${notice.deadlineDays} days`,
            passed: true
        });
    }

    const totalEvaluated = requirements.length;
    const matchedEvaluated = requirements.filter(r => r.status === 'pass').length;

    // 4. Action Plan items (interactive checklist)
    let actionPlan = [];
    if (isEligible) {
        actionPlan = [
            "Prepare resume",
            "Keep college ID ready",
            "Upload 10th marksheet",
            "Upload 12th marksheet",
            "Register before deadline"
        ];
    } else if (needsInfo) {
        actionPlan = [
            "Update academic records in student profile",
            "Keep college ID ready",
            "Upload 10th marksheet",
            "Upload 12th marksheet",
            "Register before deadline"
        ];
    } else {
        actionPlan = [
            "Review department prerequisites with academic advisor",
            "Keep portfolio updated for upcoming opportunities",
            "Maintain academic records for next hiring phase",
            "Explore alternate campus programs"
        ];
    }

    // Embed completion state if available from student profile
    const studentActionItemsState = (student.actionItems && student.actionItems[notice.id]) || {};
    actionPlan = actionPlan.map((item, index) => {
        const itemId = `action-${index}`;
        return {
            id: itemId,
            label: item,
            completed: !!studentActionItemsState[itemId]
        };
    });

    // 5. Deadline info
    const deadlineInfo = parseDeadline(notice.deadline, notice.deadlineDays || 0);

    // 6. Application URL
    const applicationUrl = notice.application_url || notice.portalUrl || null;

    return {
        ...notice,
        application_url: applicationUrl,
        portalUrl: applicationUrl,
        personalizedStatus,
        statusCategory,
        actionIndicator,
        requirements,
        whyAmISeeingThis: {
            reasons: whyReasons,
            breakdown: whyReasons,
            matchedCount: matchedEvaluated,
            totalCount: totalEvaluated,
            matchSummary: `${matchedEvaluated}/${totalEvaluated} requirements matched`
        },
        actionPlan,
        deadlineInfo,
        engineAudit: {
            status: engineResult.status,
            reasons: engineResult.reasons,
            missing_information: engineResult.missing_information,
            action_items: engineResult.action_items
        }
    };
}

module.exports = {
    evaluateNoticeForStudent
};
