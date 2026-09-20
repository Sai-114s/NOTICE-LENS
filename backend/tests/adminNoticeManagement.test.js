const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

process.env.DEMO_MODE = 'true';
const app = require('../server');
const store = require('../models/store');

const prefix = `admin-ui-test-${Date.now()}`;
const emptyStructuredNotice = () => ({
  title: null, organization: null, type: null, description: null, branches: [], years: [],
  min_cgpa: null, max_active_backlogs: null, min_10th_percentage: null,
  min_12th_percentage: null, required_degree: null, documents: [], deadline: null,
  application_url: null, application_method: null, instructions: [], contact: null
});

function draftFromStructured(structuredNotice, id) {
  return {
    id,
    title: structuredNotice.title,
    deadline: structuredNotice.deadline,
    structuredNotice,
    criteria: {
      eligible_branches: structuredNotice.branches,
      eligible_years: structuredNotice.years,
      min_cgpa: structuredNotice.min_cgpa,
      max_active_backlogs: structuredNotice.max_active_backlogs
    }
  };
}

test('Admin notice management API', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://localhost:${server.address().port}/api`;
  const post = async (url, body) => fetch(`${baseUrl}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const put = async (url, body) => fetch(`${baseUrl}${url}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  try {
    await t.test('rejects an invalid file type', async () => {
      const response = await post('/notices/extract', { file: { name: 'notice.gif', mimeType: 'image/gif', data: 'R0lGODlh' } });
      assert.strictEqual(response.status, 400);
    });

    await t.test('rejects an empty uploaded file', async () => {
      const response = await post('/notices/extract', { file: { name: 'empty.txt', mimeType: 'text/plain', data: '' } });
      assert.strictEqual(response.status, 400);
    });

    await t.test('extracts a supported local TXT file', async () => {
      const text = 'Campus Placement Drive 2026. Minimum CGPA 7.5. Apply by Friday.';
      const response = await post('/notices/extract', { file: { name: 'placement.txt', mimeType: 'text/plain', data: Buffer.from(text).toString('base64') } });
      assert.strictEqual(response.status, 200);
      assert.strictEqual((await response.json()).notice.min_cgpa, 7.5);
    });

    await t.test('reports an extraction failure safely', async () => {
      process.env.STRANDS_MODE = 'INVALID';
      const response = await post('/notices/extract', { text: 'Placement Drive' });
      delete process.env.STRANDS_MODE;
      assert.strictEqual(response.status, 422);
      const body = await response.json();
      assert.match(body.error.message, /Local notice agent exited|invalid choice/i);
    });

    await t.test('keeps absent deadline and incomplete requirements empty', async () => {
      const response = await post('/notices/extract', { text: 'Campus placement drive for interested students.' });
      assert.strictEqual(response.status, 200);
      const body = await response.json();
      assert.strictEqual(body.notice.deadline, null);
      assert.strictEqual(body.notice.min_cgpa, null);
      assert.deepStrictEqual(body.notice.documents, []);
    });

    await t.test('rejects malformed structured data before saving', async () => {
      const response = await post('/notices', { notice: { id: `${prefix}-malformed`, structuredNotice: { title: 'Only one field' } } });
      assert.strictEqual(response.status, 400);
    });

    await t.test('saves a validated notice as a draft', async () => {
      const extracted = await post('/notices/extract', { text: 'Campus Placement Drive 2026. Minimum CGPA 7.5. Apply by Friday.' });
      const { notice: structured } = await extracted.json();
      const response = await post('/notices', { notice: draftFromStructured(structured, `${prefix}-draft`) });
      assert.strictEqual(response.status, 201);
      const body = await response.json();
      assert.strictEqual(body.notice.status, 'draft');
    });

    await t.test('blocks publishing when deadline is missing', async () => {
      const structured = emptyStructuredNotice();
      structured.title = 'Campus placement notice';
      const id = `${prefix}-no-deadline`;
      assert.strictEqual((await post('/notices', { notice: draftFromStructured(structured, id) })).status, 201);
      assert.strictEqual((await put(`/notices/${id}`, { notice: { ...draftFromStructured(structured, id), status: 'reviewed' } })).status, 200);
      const response = await post(`/notices/${id}/publish`, {});
      assert.strictEqual(response.status, 422);
    });

    await t.test('publishes only after save and review', async () => {
      const extracted = await post('/notices/extract', { text: 'Campus Placement Drive 2026. Apply by Friday.' });
      const { notice: structured } = await extracted.json();
      const id = `${prefix}-publish`;
      assert.strictEqual((await post('/notices', { notice: draftFromStructured(structured, id) })).status, 201);
      assert.strictEqual((await put(`/notices/${id}`, { notice: { ...draftFromStructured(structured, id), status: 'reviewed' } })).status, 200);
      const response = await post(`/notices/${id}/publish`, {});
      assert.strictEqual(response.status, 200);
      assert.strictEqual((await response.json()).notice.status, 'published');
    });
  } finally {
    for (const notice of store.getNotices().filter((notice) => notice.id && notice.id.startsWith(prefix))) store.deleteNotice(notice.id);
    server.close();
  }
});
