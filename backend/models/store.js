const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../data/store.json');

// Initialize store if it doesn't exist
if (!fs.existsSync(STORE_PATH)) {
    const defaultData = { notices: [], students: [], audit_logs: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(defaultData, null, 2));
}

function readStore() {
    try {
        const data = fs.readFileSync(STORE_PATH, 'utf8');
        const parsed = JSON.parse(data);
        // Ensure keys exist
        if (!parsed.notices) parsed.notices = [];
        if (!parsed.students) parsed.students = [];
        if (!parsed.audit_logs) parsed.audit_logs = [];
        return parsed;
    } catch (error) {
        return { notices: [], students: [], audit_logs: [] };
    }
}

function writeStore(data) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    getNotices: () => readStore().notices,
    saveNotice: (notice) => {
        const store = readStore();
        const index = store.notices.findIndex(n => n.id === notice.id);
        if (index >= 0) {
            store.notices[index] = notice;
        } else {
            store.notices.push(notice);
        }
        writeStore(store);
    },
    deleteNotice: (id) => {
        const store = readStore();
        store.notices = store.notices.filter(n => n.id !== id);
        writeStore(store);
    },
    getStudents: () => readStore().students,
    saveStudent: (student) => {
        const store = readStore();
        const index = store.students.findIndex(s => s.id === student.id);
        if (index >= 0) {
            store.students[index] = student;
        } else {
            store.students.push(student);
        }
        writeStore(store);
    },
    deleteStudent: (id) => {
        const store = readStore();
        store.students = store.students.filter(s => s.id !== id);
        writeStore(store);
    },
    saveAuditLog: (log) => {
        const store = readStore();
        store.audit_logs.push({ timestamp: new Date().toISOString(), ...log });
        writeStore(store);
    }
};
