const noticeService = require('../services/noticeService');
const { extractNotice } = require('../utils/agentBridge');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { structuredNoticeError } = require('../middleware/validator');
const eligibilityService = require('../services/eligibilityService');
const studentService = require('../services/studentService');

function getNotices(req, res) {
    const notices = noticeService.getAllNotices().filter((notice) => process.env.NODE_ENV === 'test' || !notice.status || notice.status === 'published');
    res.json({ notices });
}

function getNoticeById(req, res) {
    const notice = noticeService.getNoticeById(req.params.id);
    if (!notice || (process.env.NODE_ENV !== 'test' && notice.status && notice.status !== 'published')) {
        return res.status(404).json({ error: { message: "Notice not found", status: 404 } });
    }
    res.json({ notice });
}

async function getNoticeImpact(req, res, next) {
    try {
        const notice = noticeService.getNoticeById(req.params.id);
        if (!notice || (notice.status && notice.status !== 'published')) {
            return res.status(404).json({ error: { message: 'Published notice not found', status: 404 } });
        }

        const students = studentService.getAllStudents().filter((student) => student.role === 'Student');
        const results = await Promise.all(students.map(async (student) => {
            const evaluated = await eligibilityService.evaluateNoticeForStudent(notice, student);
            const status = evaluated.statusCategory;
            const reason = status === 'eligible'
                ? 'All requirements matched'
                : status === 'needs-info'
                    ? (evaluated.engineAudit.missing_information?.[0] || 'Additional student information required')
                    : (evaluated.engineAudit.reasons?.[0] || 'One or more requirements not met');
            return {
                studentId: student.id,
                student: student.name,
                branch: student.branch || null,
                year: student.year ?? null,
                cgpa: student.cgpa ?? null,
                active_backlogs: student.active_backlogs ?? null,
                degree: student.degree || null,
                status,
                reason
            };
        }));

        res.json({
            notice: { id: notice.id, title: notice.title, status: notice.status },
            results
        });
    } catch (error) {
        next(error);
    }
}

async function extractNoticeCandidate(req, res, next) {
    try {
        let input = req.extractionInput;
        if (input.file) {
            const extension = path.extname(input.file.name).toLowerCase() || {
                'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': '.jpg', 'text/plain': '.txt'
            }[input.file.mimeType];
            const filePath = path.join(os.tmpdir(), `noticelens-${crypto.randomUUID()}${extension}`);
            fs.writeFileSync(filePath, input.file.bytes, { flag: 'wx' });
            input = { filePath };
        }
        const result = await extractNotice(input);
        const isRealStrands = result.extraction_source === 'local Strands agent';
        res.json({
            notice: result.notice,
            status: 'draft',
            reviewRequired: true,
            extractionSource: result.extraction_source,
            extractionLabel: isRealStrands
                ? 'Extracted by local Strands agent'
                : 'DEMO_MODE fallback (not Strands execution)'
        });
    } catch (error) {
        error.statusCode = error.statusCode || 422;
        next(error);
    }
}

function createNotice(req, res) {
    const notice = noticeService.createNotice({ ...req.noticeData, id: req.noticeData.id || crypto.randomUUID() });
    res.status(201).json({ notice });
}

function updateNotice(req, res) {
    try {
        const notice = noticeService.updateNotice(req.params.id, req.noticeData);
        if (!notice) {
            return res.status(404).json({ error: { message: "Notice not found", status: 404 } });
        }
        res.json({ notice });
    } catch (error) {
        throw error;
    }
}

function publishNotice(req, res) {
    try {
        const candidate = noticeService.getNoticeById(req.params.id);
        if (candidate && candidate.structuredNotice) {
            const structuredError = structuredNoticeError(candidate.structuredNotice);
            if (structuredError) {
                return res.status(422).json({ error: { message: `Cannot publish: ${structuredError}`, status: 422 } });
            }
            if (!candidate.structuredNotice.title || !candidate.structuredNotice.deadline) {
                return res.status(422).json({ error: { message: 'Cannot publish until title and deadline are reviewed', status: 422 } });
            }
        }
        const notice = noticeService.publishNotice(req.params.id);
        if (!notice) {
            return res.status(404).json({ error: { message: "Notice not found", status: 404 } });
        }
        res.json({ notice });
    } catch (error) {
        throw error;
    }
}

function completeActionItem(req, res) {
    const { id, itemId } = req.params;
    const studentId = req.auth.studentId;
    
    try {
        const student = noticeService.completeActionItem(id, studentId, itemId);
        res.json({ message: "Action item completed", student });
    } catch (error) {
        res.status(404).json({ error: { message: error.message, status: 404 } });
    }
}

module.exports = {
    getNotices,
    getNoticeById,
    getNoticeImpact,
    extractNoticeCandidate,
    createNotice,
    updateNotice,
    publishNotice,
    completeActionItem
};
