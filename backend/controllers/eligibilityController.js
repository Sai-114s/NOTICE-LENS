const eligibilityService = require('../services/eligibilityService');
const noticeService = require('../services/noticeService');
const studentService = require('../services/studentService');

async function checkEligibility(req, res, next) {
    try {
        const { notice, student } = req.body;
        
        const evaluatedNotice = await eligibilityService.evaluateNoticeForStudent(notice, student);
        res.json({ notice: evaluatedNotice });
    } catch (error) {
        next(error);
    }
}

async function getStudentDashboardNotices(req, res, next) {
    try {
        const studentId = req.params.id;
        let student = studentService.getStudentById(studentId);
        
        // If student is passed in body (like previous monolithic POST /api/student/dashboard), use that
        if (req.body && req.body.student && req.body.student.id === studentId) {
            student = req.body.student;
        }

        if (!student) {
            return res.status(404).json({ error: { message: "Student not found", status: 404 } });
        }

        const notices = noticeService.getAllNotices();
        const evaluatedNotices = [];

        for (const notice of notices) {
            const evaluated = await eligibilityService.evaluateNoticeForStudent(notice, student);
            evaluatedNotices.push(evaluated);
        }

        const stats = {
            relevantNotices: evaluatedNotices.length,
            eligible: evaluatedNotices.filter(n => n.statusCategory === 'eligible').length,
            needsInformation: evaluatedNotices.filter(n => n.statusCategory === 'needs-info').length,
            deadlinesThisWeek: evaluatedNotices.filter(n => (n.deadlineDays || 0) <= 7).length
        };

        res.json({
            studentId: student.id,
            notices: evaluatedNotices,
            stats
        });
    } catch (error) {
        next(error);
    }
}

async function getStudentNoticeDetail(req, res, next) {
    try {
        const { studentId, noticeId } = req.params;
        let student = studentService.getStudentById(studentId);
        
        if (req.body && req.body.student && req.body.student.id === studentId) {
            student = req.body.student;
        }
        
        if (!student) {
            return res.status(404).json({ error: { message: "Student not found", status: 404 } });
        }
        
        const notice = noticeService.getNoticeById(noticeId);
        if (!notice) {
            return res.status(404).json({ error: { message: "Notice not found", status: 404 } });
        }
        
        const evaluatedNotice = await eligibilityService.evaluateNoticeForStudent(notice, student);
        res.json({ notice: evaluatedNotice });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    checkEligibility,
    getStudentDashboardNotices,
    getStudentNoticeDetail
};
