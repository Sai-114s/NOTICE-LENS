const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../data/store.json');

// Initialize store if it doesn't exist
if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ notices: [], audit_logs: [] }, null, 2));
}

function readStore() {
    try {
        const data = fs.readFileSync(STORE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { notices: [], audit_logs: [] };
    }
}

function writeStore(data) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    getNotices: () => readStore().notices,
    saveNotice: (notice) => {
        const store = readStore();
        store.notices.push(notice);
        writeStore(store);
    },
    saveAuditLog: (log) => {
        const store = readStore();
        store.audit_logs.push({ timestamp: new Date().toISOString(), ...log });
        writeStore(store);
    }
};
