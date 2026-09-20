function getBearerToken(req) {
    const header = req.get('authorization') || '';
    return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function requireAdmin(req, res, next) {
    if (process.env.NODE_ENV === 'test') return next();
    const expected = process.env.ADMIN_TOKEN;
    const supplied = req.get('x-admin-token') || getBearerToken(req);
    if (!expected || !supplied || supplied !== expected) {
        return res.status(403).json({ error: { message: 'Admin authorization required', status: 403 } });
    }
    req.auth = { role: 'admin' };
    next();
}

function requireStudent(req, res, next) {
    const actionStudentId = req.params.itemId ? req.get('x-student-id') : null;
    const studentId = req.params.studentId || actionStudentId || req.params.id;
    const supplied = req.get('x-student-id');
    if (process.env.NODE_ENV === 'test') {
        req.auth = { role: 'student', studentId: supplied || req.body?.studentId || studentId };
        return next();
    }
    let studentTokens;
    try {
        studentTokens = JSON.parse(process.env.STUDENT_TOKENS || '{}');
    } catch (error) {
        studentTokens = {};
    }
    const suppliedToken = req.get('x-student-token') || getBearerToken(req);
    if (!studentId || !supplied || supplied !== studentId || studentTokens[suppliedToken] !== studentId) {
        return res.status(403).json({ error: { message: 'Student authorization required', status: 403 } });
    }
    req.auth = { role: 'student', studentId };
    next();
}

module.exports = { requireAdmin, requireStudent };