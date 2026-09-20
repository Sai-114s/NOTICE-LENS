/**
 * Utility for exporting notice-wise student eligibility data
 * to Microsoft Excel-compatible spreadsheet formats.
 */

export function downloadEligibleStudentsExcel(notice, students, mode = 'eligible') {
  const targetStudents = mode === 'eligible' 
    ? students.filter((s) => s.status === 'eligible')
    : students;

  const headers = [
    'Notice Title',
    'Organization',
    'Opportunity Type',
    'Student ID',
    'Student Name',
    'Department / Branch',
    'Academic Year',
    'Current CGPA',
    'Active Backlogs',
    'Degree Program',
    'Eligibility Verdict',
    'Qualification Reason / Audit',
    'Notice Deadline',
    'Export Timestamp'
  ];

  const exportTimestamp = new Date().toLocaleString();
  const noticeTitle = notice.title || 'Untitled Notice';
  const org = notice.organization || 'Placement Cell';
  const oppType = notice.opportunityType || 'Placement';
  const deadline = notice.deadline || 'N/A';

  const rows = targetStudents.map((s) => {
    const studentId = s.studentId || s.id || 'N/A';
    const name = s.student || s.name || 'Unknown';
    const branch = s.branch || 'N/A';
    const year = s.year ?? 'N/A';
    const cgpa = s.cgpa ?? 'N/A';
    const backlogs = s.active_backlogs ?? 0;
    const degree = s.degree || 'B.Tech';
    const status = (s.status || 'eligible').toUpperCase();
    const reason = s.reason || 'All requirements matched';

    return [
      escapeCsv(noticeTitle),
      escapeCsv(org),
      escapeCsv(oppType),
      escapeCsv(studentId),
      escapeCsv(name),
      escapeCsv(branch),
      escapeCsv(year),
      escapeCsv(cgpa),
      escapeCsv(backlogs),
      escapeCsv(degree),
      escapeCsv(status),
      escapeCsv(reason),
      escapeCsv(deadline),
      escapeCsv(exportTimestamp)
    ];
  });

  // Prepend UTF-8 Byte Order Mark (BOM) so Microsoft Excel opens it directly with correct encoding
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const sanitizedTitle = noticeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 35);
  const prefix = mode === 'eligible' ? 'Eligible_Students' : 'All_Students_Evaluation';
  link.setAttribute('href', url);
  link.setAttribute('download', `${prefix}_${sanitizedTitle}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
