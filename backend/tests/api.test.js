const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../server');
const store = require('../models/store');

test('Backend API Tests', async (t) => {
    // Start server
    let server;
    let baseUrl;
    await new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, () => {
            const port = server.address().port;
            baseUrl = `http://localhost:${port}/api`;
            resolve();
        });
    });

    const testNotice = {
        id: "test-notice-1",
        title: "Test Notice",
        organization: "Test Org",
        criteria: {
            min_cgpa: 7.0
        }
    };

    const testStudent = {
        id: "test-student-1",
        cgpa: 8.0,
        branch: "CSE"
    };

    await t.test('POST /api/notices - Create Notice (Draft)', async () => {
        const res = await fetch(`${baseUrl}/notices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notice: testNotice })
        });
        assert.strictEqual(res.status, 201);
        const data = await res.json();
        assert.strictEqual(data.notice.id, "test-notice-1");
        assert.strictEqual(data.notice.status, "draft");
    });

    await t.test('GET /api/notices - List Notices', async () => {
        const res = await fetch(`${baseUrl}/notices`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(data.notices.some((notice) => notice.id === testNotice.id));
    });

    await t.test('GET /api/notices/:id - Read Notice', async () => {
        const res = await fetch(`${baseUrl}/notices/${testNotice.id}`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.notice.title, testNotice.title);
    });

    await t.test('PUT /api/notices/:id - Review Notice', async () => {
        const res = await fetch(`${baseUrl}/notices/${testNotice.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notice: { title: 'Reviewed Test Notice', status: 'reviewed' } })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.notice.status, "reviewed");
        assert.strictEqual(data.notice.title, "Reviewed Test Notice");
    });

    await t.test('POST /api/notices/:id/publish - Publish Notice', async () => {
        const res = await fetch(`${baseUrl}/notices/${testNotice.id}/publish`, {
            method: 'POST'
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.notice.status, "published");
    });

    await t.test('GET /api/notices/:id/impact - Deterministic student impact', async () => {
        const res = await fetch(`${baseUrl}/notices/${testNotice.id}/impact`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(data.results.length > 0);
        const counts = data.results.reduce((summary, result) => {
            summary.evaluated += 1;
            summary[result.status] = (summary[result.status] || 0) + 1;
            return summary;
        }, { evaluated: 0 });
        assert.strictEqual(counts.evaluated, data.results.length);
        assert.strictEqual(counts.eligible + (counts['not-eligible'] || 0) + (counts['needs-info'] || 0), counts.evaluated);
        assert.ok(data.results.every((result) => ['eligible', 'not-eligible', 'needs-info'].includes(result.status)));
    });

    await t.test('PUT /api/students/:id - Update Student', async () => {
        const res = await fetch(`${baseUrl}/students/${testStudent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student: testStudent })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.student.id, "test-student-1");
    });

    await t.test('GET /api/students and GET /api/students/:id - Read Students', async () => {
        const listRes = await fetch(`${baseUrl}/students`);
        assert.strictEqual(listRes.status, 200);
        const listData = await listRes.json();
        assert.ok(listData.students.some((student) => student.id === testStudent.id));

        const detailRes = await fetch(`${baseUrl}/students/${testStudent.id}`);
        assert.strictEqual(detailRes.status, 200);
        const detailData = await detailRes.json();
        assert.strictEqual(detailData.student.id, testStudent.id);
    });

    await t.test('GET /api/students/:id/notices - Evaluated Student Notices', async () => {
        const res = await fetch(`${baseUrl}/students/${testStudent.id}/notices`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.ok(Array.isArray(data.notices));
        assert.ok(data.notices.every((notice) => notice.statusCategory));
    });

    await t.test('POST /api/eligibility/check - Valid Eligibility', async () => {
        const res = await fetch(`${baseUrl}/eligibility/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notice: testNotice, student: testStudent })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.notice.statusCategory, "eligible");
    });

    await t.test('POST /api/eligibility/check - Needs Information', async () => {
        const res = await fetch(`${baseUrl}/eligibility/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                notice: { id: 'needs-info-notice', title: 'Needs Info', criteria: { min_cgpa: 7.0 } },
                student: { id: 'needs-info-student', branch: 'CSE' }
            })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.notice.statusCategory, "needs-info");
    });

    await t.test('POST /api/notices/:id/action-items/:itemId/complete', async () => {
        const res = await fetch(`${baseUrl}/notices/${testNotice.id}/action-items/action-0/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: testStudent.id })
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.student.actionItems[testNotice.id]['action-0'], true);
    });

    await t.test('Validation: Missing ID for Notice', async () => {
        const res = await fetch(`${baseUrl}/notices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notice: {} })
        });
        assert.strictEqual(res.status, 400);
    });

    await t.test('Validation: Invalid Student', async () => {
        const res = await fetch(`${baseUrl}/students/invalid-student`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student: { id: 'invalid-student', year: 0 } })
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.error.status, 400);
    });

    await t.test('Validation: Malformed JSON', async () => {
        const res = await fetch(`${baseUrl}/notices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{"title":'
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.error.status, 400);
    });

    await t.test('404: Missing ID route', async () => {
        const res = await fetch(`${baseUrl}/notices/does-not-exist/publish`, {
            method: 'POST'
        });
        assert.strictEqual(res.status, 404);
    });

    // Teardown
    store.deleteNotice(testNotice.id);
    store.deleteStudent(testStudent.id);
    server.close();
});
