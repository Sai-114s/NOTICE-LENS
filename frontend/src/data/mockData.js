export const PROFILES = [
  {
    id: 'rahul-cse',
    name: 'Rahul Sharma',
    role: 'Student',
    branch: 'CSE',
    branchFullName: 'Computer Science & Engineering',
    year: 4,
    cgpa: 8.4,
    active_backlogs: 0,
    semester: 7,
    statusText: 'All Academic Records Verified',
    avatarLetter: 'RS'
  },
  {
    id: 'arjun-mech',
    name: 'Arjun Kumar',
    role: 'Student',
    branch: 'Mechanical',
    branchFullName: 'Mechanical Engineering',
    year: 4,
    cgpa: 7.1,
    active_backlogs: 1,
    semester: 7,
    statusText: 'Core Technical Profile Verified',
    avatarLetter: 'AK'
  },
  {
    id: 'priya-missing',
    name: 'Priya Singh',
    role: 'Student',
    branch: 'Information Technology',
    branchFullName: 'Information Technology',
    year: 3,
    cgpa: null,
    active_backlogs: null,
    semester: 5,
    statusText: 'Academic Records Pending Verification',
    avatarLetter: 'PS'
  },
  {
    id: 'admin-user',
    name: 'Admin',
    role: 'Placement & Academic Cell',
    branch: 'Institutional Admin',
    branchFullName: 'Office of Dean Academic Affairs',
    year: null,
    cgpa: null,
    active_backlogs: null,
    semester: null,
    statusText: 'Notice Ingestion & Rule Engine Control',
    avatarLetter: 'AD'
  }
];

export const NOTICES_MOCK = [
  {
    id: 'notice-001',
    title: 'Campus Placement Drive 2026 — Vertex Core Technologies',
    category: 'Placement',
    publishDate: 'Sep 18, 2026',
    deadline: 'Sep 22, 2026',
    isUrgent: true,
    summary: 'Full-time software engineering and systems roles for final year students. Includes high-performance computing, distributed backend, and platform tooling.',
    criteria: {
      min_cgpa: 7.5,
      allowed_branches: ['CSE', 'Information Technology', 'ECE'],
      allowed_years: [4],
      max_backlogs: 0
    },
    actions: [
      { label: 'Apply on College Portal', url: 'https://portal.university.edu/placements/vertex', type: 'primary' },
      { label: 'View Role Spec', url: '#', type: 'secondary' }
    ]
  },
  {
    id: 'notice-002',
    title: 'National Smart India Hackathon 2026 — Internal Selection',
    category: 'Hackathon',
    publishDate: 'Sep 16, 2026',
    deadline: 'Sep 30, 2026',
    isUrgent: false,
    summary: 'Internal screening for national ministry problem statements. Open to all engineering disciplines with verified teams of 6 students.',
    criteria: {
      min_cgpa: 0.0,
      allowed_branches: [], // All branches
      allowed_years: [3, 4],
      max_backlogs: 99
    },
    actions: [
      { label: 'Submit Team Proposal', url: '#', type: 'primary' },
      { label: 'Guidelines PDF', url: '#', type: 'secondary' }
    ]
  },
  {
    id: 'notice-003',
    title: 'Merit-cum-Means State Scholarship 2026-27',
    category: 'Scholarship',
    publishDate: 'Sep 14, 2026',
    deadline: 'Oct 10, 2026',
    isUrgent: false,
    summary: 'Annual tuition fee remission grant for meritorious students. Requires submission of academic performance transcript and authenticated income certificate.',
    criteria: {
      min_cgpa: 8.0,
      allowed_branches: [], // All branches
      allowed_years: [1, 2, 3, 4],
      max_backlogs: 0
    },
    actions: [
      { label: 'Upload Documents', url: '#', type: 'primary' },
      { label: 'Download Format', url: '#', type: 'secondary' }
    ]
  },
  {
    id: 'notice-004',
    title: 'Tata Motors Core Engineering Graduate Program',
    category: 'Placement',
    publishDate: 'Sep 12, 2026',
    deadline: 'Sep 25, 2026',
    isUrgent: true,
    summary: 'Graduate engineer trainee program focused on automotive powertrain, thermal dynamics, and EV battery packaging systems.',
    criteria: {
      min_cgpa: 6.8,
      allowed_branches: ['Mechanical', 'Automobile', 'Production'],
      allowed_years: [4],
      max_backlogs: 1
    },
    actions: [
      { label: 'Register for Drive', url: '#', type: 'primary' },
      { label: 'Syllabus & Pattern', url: '#', type: 'secondary' }
    ]
  }
];
