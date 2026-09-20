async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Request failed with status ${response.status}`);
  }
  return data;
}

let currentRole = 'Student';

export function setActiveRole(role) {
  currentRole = role;
}

const adminHeaders = () => {
  if (currentRole !== 'Admin') {
    return {};
  }
  const token = import.meta.env.VITE_ADMIN_TOKEN;
  return token ? { 'X-Admin-Token': token } : {};
};

export async function getNoticeById(noticeId) {
  return request(`/api/notices/${noticeId}`);
}

export async function getPublishedNotices() {
  return request('/api/notices');
}

export async function getNoticeImpact(noticeId) {
  return request(`/api/notices/${noticeId}/impact`, { headers: adminHeaders() });
}

export async function extractNotice(input) {
  return request('/api/notices/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(input)
  });
}

export async function createNotice(notice) {
  return request('/api/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ notice })
  });
}

export async function updateNotice(noticeId, notice) {
  return request(`/api/notices/${noticeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify({ notice })
  });
}

export async function publishNotice(noticeId) {
  return request(`/api/notices/${noticeId}/publish`, { method: 'POST', headers: adminHeaders() });
}
