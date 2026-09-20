async function request(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Student request failed: ${response.status} - ${errorText}`);
  }
  return response.json();
}

export async function getStudents() {
  return request('/api/students');
}

export async function getStudentById(studentId) {
  return request(`/api/students/${studentId}`, { headers: { 'X-Student-Id': studentId, ...studentHeaders(studentId) } });
}

export function studentHeaders(studentId) {
  let tokenMap = {};
  try {
    tokenMap = JSON.parse(import.meta.env.VITE_STUDENT_TOKENS || '{}');
  } catch {
    tokenMap = {};
  }
  const token = tokenMap[studentId] || import.meta.env.VITE_STUDENT_TOKEN;
  return token ? { 'X-Student-Token': token } : {};
}

export async function updateStudent(studentId, student) {
  return request(`/api/students/${studentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student })
  });
}
