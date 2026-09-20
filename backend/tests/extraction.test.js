const test = require('node:test');
const assert = require('node:assert');
const http = require('http');

process.env.DEMO_MODE = 'true';
const app = require('../server');

test('Local notice extraction endpoint', async (t) => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const baseUrl = `http://localhost:${server.address().port}/api`;

    await t.test('returns a validated draft candidate in demo mode', async () => {
        const response = await fetch(`${baseUrl}/notices/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'Campus placement drive with minimum CGPA 7.5.' })
        });
        assert.strictEqual(response.status, 200);
        const data = await response.json();
        assert.strictEqual(data.status, 'draft');
        assert.strictEqual(data.reviewRequired, true);
        assert.strictEqual(data.extractionLabel, 'DEMO_MODE fallback (not Strands execution)');
        assert.ok(Array.isArray(data.notice.branches));
    });

    await t.test('rejects empty extraction input safely', async () => {
        const response = await fetch(`${baseUrl}/notices/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: '' })
        });
        assert.strictEqual(response.status, 400);
        const data = await response.json();
        assert.strictEqual(data.error.status, 400);
    });

    server.close();
});
