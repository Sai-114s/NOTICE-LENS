function validateStudentPayload(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ error: { message: "Request body must be a JSON object", status: 400 } });
    }
    const student = req.body.student || req.body;
    if (!student || typeof student !== 'object' || !student.id || typeof student.id !== 'string') {
        return res.status(400).json({ error: { message: "Student object with string 'id' is required", status: 400 } });
    }
    if (student.year !== undefined && student.year !== null && (!Number.isInteger(student.year) || student.year < 1)) {
        return res.status(400).json({ error: { message: "Student 'year' must be a positive integer", status: 400 } });
    }
    for (const field of ['cgpa', 'active_backlogs', 'tenth_percentage', 'twelfth_percentage']) {
        if (student[field] !== undefined && student[field] !== null && (!Number.isFinite(Number(student[field])) || Number(student[field]) < 0)) {
            return res.status(400).json({ error: { message: `Student '${field}' must be a non-negative number`, status: 400 } });
        }
    }
    req.studentData = student;
    next();
}

const STRUCTURED_FIELDS = new Set([
    'title', 'organization', 'type', 'description', 'branches', 'years', 'min_cgpa',
    'max_active_backlogs', 'min_10th_percentage', 'min_12th_percentage', 'required_degree',
    'documents', 'deadline', 'application_url', 'application_method', 'instructions', 'contact'
]);
const LIST_FIELDS = new Set(['branches', 'years', 'documents', 'instructions']);

function structuredNoticeError(notice) {
    if (!notice || typeof notice !== 'object' || Array.isArray(notice)) return 'Structured notice must be an object';
    const keys = Object.keys(notice);
    const unknown = keys.filter((key) => !STRUCTURED_FIELDS.has(key));
    const missing = [...STRUCTURED_FIELDS].filter((key) => !(key in notice));
    if (unknown.length) return `Unexpected structured notice fields: ${unknown.join(', ')}`;
    if (missing.length) return `Missing structured notice fields: ${missing.join(', ')}`;
    for (const field of STRUCTURED_FIELDS) {
        if (LIST_FIELDS.has(field) || ['min_cgpa', 'max_active_backlogs', 'min_10th_percentage', 'min_12th_percentage'].includes(field)) continue;
        if (notice[field] !== null && (typeof notice[field] !== 'string' || !notice[field].trim())) return `Structured notice '${field}' must be a non-empty string or null`;
    }
    for (const field of ['branches', 'documents', 'instructions']) {
        if (!Array.isArray(notice[field]) || notice[field].some((item) => typeof item !== 'string' || !item.trim())) return `Structured notice '${field}' must be an array of non-empty strings`;
    }
    if (!Array.isArray(notice.years) || notice.years.some((year) => !Number.isInteger(year) || year < 1)) {
        return "Structured notice 'years' must be an array of positive integers";
    }
    for (const field of ['min_cgpa', 'min_10th_percentage', 'min_12th_percentage']) {
        if (notice[field] !== null && (!Number.isFinite(notice[field]) || notice[field] < 0)) return `Structured notice '${field}' must be a non-negative number or null`;
    }
    if (notice.min_cgpa !== null && notice.min_cgpa > 10) return "Structured notice 'min_cgpa' must be at most 10";
    if (notice.min_10th_percentage !== null && notice.min_10th_percentage > 100) return "Structured notice 'min_10th_percentage' must be at most 100";
    if (notice.min_12th_percentage !== null && notice.min_12th_percentage > 100) return "Structured notice 'min_12th_percentage' must be at most 100";
    if (notice.max_active_backlogs !== null && (!Number.isInteger(notice.max_active_backlogs) || notice.max_active_backlogs < 0)) return "Structured notice 'max_active_backlogs' must be a non-negative integer or null";
    if (notice.application_url !== null) {
        try {
            const parsed = new URL(notice.application_url);
            if (!['http:', 'https:'].includes(parsed.protocol)) return "Structured notice 'application_url' must use http(s)";
        } catch (error) {
            return "Structured notice 'application_url' must be an absolute http(s) URL or null";
        }
    }
    return null;
}

function validateNoticePayload(req, res, next) {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ error: { message: "Request body must be a JSON object", status: 400 } });
    }
    const notice = req.body.notice || req.body;
    if (notice && notice.structuredNotice) {
        const error = structuredNoticeError(notice.structuredNotice);
        if (error) return res.status(400).json({ error: { message: error, status: 400 } });
        req.noticeData = notice;
        return next();
    }
    if (!notice || typeof notice !== 'object' || typeof notice.title !== 'string' || !notice.title.trim()) {
        return res.status(400).json({ error: { message: "Notice object with non-empty string 'title' is required", status: 400 } });
    }
    if (notice.criteria !== undefined && (typeof notice.criteria !== 'object' || notice.criteria === null || Array.isArray(notice.criteria))) {
        return res.status(400).json({ error: { message: "Notice 'criteria' must be a JSON object", status: 400 } });
    }
    if (notice.status !== undefined && !['draft', 'reviewed', 'published'].includes(notice.status)) {
        return res.status(400).json({ error: { message: "Notice status must be draft, reviewed, or published", status: 400 } });
    }
    req.noticeData = notice;
    next();
}

function validateEligibilityPayload(req, res, next) {
    const { notice, student } = req.body || {};
    if (!notice || typeof notice !== 'object' || !student || typeof student !== 'object') {
        return res.status(400).json({ error: { message: "Both 'notice' and 'student' objects are required in body", status: 400 } });
    }
    if (!student.id || typeof student.id !== 'string') {
        return res.status(400).json({ error: { message: "Student object with string 'id' is required", status: 400 } });
    }
    if (!notice.criteria || typeof notice.criteria !== 'object' || Array.isArray(notice.criteria)) {
        return res.status(400).json({ error: { message: "Notice object with 'criteria' is required", status: 400 } });
    }
    next();
}

function validateExtractionPayload(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: { message: "A notice text or file is required", status: 400 } });
    }
    if (typeof req.body.text === 'string' && req.body.text.trim()) {
        req.extractionInput = { rawText: req.body.text };
        return next();
    }
    const file = req.body.file;
    const supported = new Set(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']);
    const allowedExtensions = { 'application/pdf': '.pdf', 'image/png': '.png', 'image/jpeg': ['.jpg', '.jpeg'], 'text/plain': '.txt' };
    const extension = file && typeof file.name === 'string' ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
    const allowedForMime = file && allowedExtensions[file.mimeType];
    const extensionMatches = Array.isArray(allowedForMime) ? allowedForMime.includes(extension) : extension === allowedForMime;
    if (!file || typeof file !== 'object' || !supported.has(file.mimeType) || typeof file.name !== 'string' || typeof file.data !== 'string' || !extensionMatches) {
        return res.status(400).json({ error: { message: "Upload a PDF, PNG, JPG, or TXT notice file", status: 400 } });
    }
    let bytes;
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.data) || file.data.length % 4 !== 0) {
        return res.status(400).json({ error: { message: 'Uploaded file data is invalid', status: 400 } });
    }
    bytes = Buffer.from(file.data, 'base64');
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: { message: 'Uploaded file is empty or exceeds the 10 MB limit', status: 400 } });
    }
    req.extractionInput = { file: { name: file.name, mimeType: file.mimeType, bytes } };
    next();
}

module.exports = {
    validateStudentPayload,
    validateNoticePayload,
    validateEligibilityPayload,
    validateExtractionPayload,
    structuredNoticeError
};
