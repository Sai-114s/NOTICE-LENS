import { studentHeaders } from './studentService';

async function request(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Action item request failed: ${response.status} - ${errorText}`);
  }
  return response.json();
}

export async function completeActionItem(noticeId, itemId, studentId) {
  return request(`/api/notices/${noticeId}/action-items/${itemId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Student-Id': studentId, ...studentHeaders(studentId) },
    body: JSON.stringify({ studentId })
  });
}
