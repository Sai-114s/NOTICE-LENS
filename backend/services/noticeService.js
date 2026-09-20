const store = require('../models/store');
const studentService = require('./studentService');

function getAllNotices() {
    return store.getNotices();
}

function getNoticeById(id) {
    const notices = store.getNotices();
    return notices.find(n => n.id === id);
}

function createNotice(noticeData) {
    const newNotice = {
        ...noticeData,
        status: 'draft'
    };
    store.saveNotice(newNotice);
    return newNotice;
}

function updateNotice(id, noticeData) {
    const existing = getNoticeById(id);
    if (!existing) return null;

    if (noticeData.status && noticeData.status !== existing.status) {
        const allowedTransition = existing.status === 'draft' && noticeData.status === 'reviewed';
        if (!allowedTransition) {
            const error = new Error(`Notice cannot transition from ${existing.status || 'draft'} to ${noticeData.status}`);
            error.statusCode = 409;
            throw error;
        }
    }
    
    const updated = {
        ...existing,
        ...noticeData,
        id // prevent ID change
    };
    store.saveNotice(updated);
    return updated;
}

function publishNotice(id) {
    const notice = getNoticeById(id);
    if (!notice) return null;

    if (notice.status !== 'reviewed') {
        const error = new Error('Notice must be reviewed before it can be published');
        error.statusCode = 409;
        throw error;
    }
    
    notice.status = 'published';
    store.saveNotice(notice);
    return notice;
}

function completeActionItem(noticeId, studentId, itemId) {
    const student = studentService.getStudentById(studentId);
    if (!student) throw new Error("Student not found");
    
    // We store action item state on the student profile like:
    // student.actionItems = { [noticeId]: { [itemId]: true } }
    if (!student.actionItems) student.actionItems = {};
    if (!student.actionItems[noticeId]) student.actionItems[noticeId] = {};
    
    student.actionItems[noticeId][itemId] = true;
    
    return studentService.createOrUpdateStudent(student);
}

module.exports = {
    getAllNotices,
    getNoticeById,
    createNotice,
    updateNotice,
    publishNotice,
    completeActionItem
};
