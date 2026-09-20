const store = require('../models/store');

function getAllStudents() {
    return store.getStudents();
}

function getStudentById(id) {
    const students = store.getStudents();
    return students.find(s => s.id === id);
}

function createOrUpdateStudent(studentData) {
    const existing = getStudentById(studentData.id);
    const updated = {
        ...existing,
        ...studentData,
    };
    if (!updated.actionItems) {
        updated.actionItems = existing?.actionItems || {};
    }
    store.saveStudent(updated);
    return updated;
}

module.exports = {
    getAllStudents,
    getStudentById,
    createOrUpdateStudent
};
