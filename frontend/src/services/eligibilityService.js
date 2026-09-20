import { studentHeaders } from './studentService';

async function request(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Eligibility request failed: ${response.status} - ${errorText}`);
  }
  return response.json();
}

export async function checkEligibility(notice, student) {
  return request('/api/eligibility/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notice, student })
  });
}

export async function getStudentDashboardData(student) {
  return request(`/api/students/${student.id}/dashboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Student-Id': student.id, ...studentHeaders(student.id) },
    body: JSON.stringify({ student })
  });
}

export async function getEvaluatedNoticeForStudent(noticeId, student) {
  return request(`/api/students/${student.id}/notices/${noticeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Student-Id': student.id, ...studentHeaders(student.id) },
    body: JSON.stringify({ student })
  });
}
