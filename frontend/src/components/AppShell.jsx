import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import StudentDashboard from './StudentDashboard';
import NoticeDetailView from './NoticeDetailView';
import AdminNoticeManager from './AdminNoticeManager';
import AdminImpactAnalysis from './AdminImpactAnalysis';
import NoticeSearch from './NoticeSearch';
import StatusBadge from './StatusBadge';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { getStudents, getStudentById } from '../services/studentService';
import { getStudentDashboardData, getEvaluatedNoticeForStudent } from '../services/eligibilityService';
import { Shield, FileText, ShieldAlert } from 'lucide-react';
import { setActiveRole } from '../services/noticeService';

const ADMIN_USER = {
  id: 'admin-user',
  name: 'Admin User',
  role: 'Admin',
  branch: 'Admin Panel',
  branchFullName: 'Office of Dean Academic Affairs & Placement Cell',
  year: null,
  cgpa: null,
  active_backlogs: null,
  semester: null,
  statusText: 'Notice Ingestion & Publishing Authority',
  avatarLetter: 'AU'
};

export const AppShell = () => {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [adminTab, setAdminTab] = useState('notices'); // 'notices' | 'impact'
  const [selectedNoticeId, setSelectedNoticeId] = useState(null);
  const [selectedNoticeDetail, setSelectedNoticeDetail] = useState(null);
  const [noticeError, setNoticeError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getStudents()
      .then((data) => {
        if (!active) return;
        const students = (data.students || []).filter((student) => student.role === 'Student' && student.name);
        setProfiles([...students, ADMIN_USER]);
        if (students.length > 0) {
          const rahul = students.find((s) => s.id === 'rahul-sharma') || students[0];
          getStudentById(rahul.id).then((profileData) => {
            if (active && profileData?.student) {
              setCurrentProfile(profileData.student);
              setActiveRole('Student');
            }
          });
        }
      })
      .catch((error) => {
        if (active) setProfilesError(error.message || 'Unable to load student records');
      })
      .finally(() => {
        if (active) setProfilesLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Sync route changes with backend deterministic evaluation
  const navigateToNotice = async (noticeId, profile = currentProfile) => {
    setSelectedNoticeId(noticeId);
    setCurrentView('notice-detail');
    setSelectedNoticeDetail(null);
    setNoticeError(null);
    // Update browser URL to /student/notices/:id cleanly without full reload
    window.history.pushState({}, '', `/student/notices/${noticeId}`);
    try {
      const data = await getEvaluatedNoticeForStudent(noticeId, profile);
      if (data.notice) {
        setSelectedNoticeDetail(data.notice);
        return;
      }
      const dashData = await getStudentDashboardData(profile);
      const evalNotice = dashData.notices?.find((n) => n.id === noticeId);
      setSelectedNoticeDetail(evalNotice);
    } catch (e) {
      console.error('Notice fetch error:', e);
      setNoticeError(e.message || 'Unable to load notice evaluation');
    }
  };

  const navigateToDashboard = () => {
    setSelectedNoticeId(null);
    setSelectedNoticeDetail(null);
    setNoticeError(null);
    setCurrentView('dashboard');
    window.history.pushState({}, '', '/student/dashboard');
  };

  useEffect(() => {
    const match = window.location.pathname.match(/\/student\/notices\/([^/]+)/);
    if (!profilesLoading && currentProfile && match) {
      if (currentView !== 'notice-detail' || selectedNoticeId !== match[1]) {
        navigateToNotice(match[1], currentProfile);
      }
    }
  }, [profilesLoading, currentProfile, currentView, selectedNoticeId]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/\/student\/notices\/(.+)/);
      if (match) {
        navigateToNotice(match[1]);
      } else {
        setSelectedNoticeId(null);
        setSelectedNoticeDetail(null);
        setCurrentView('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentProfile]);

  const getPageTitle = () => {
    if (currentView === 'notice-detail') {
      return selectedNoticeDetail ? selectedNoticeDetail.title : 'Notice Details';
    }
    switch (currentView) {
      case 'dashboard':
        return 'Student Dashboard';
      case 'notices':
        return 'Campus Notices Catalog';
      case 'profile':
        return 'Academic Record';
      case 'admin':
        return adminTab === 'notices' ? 'Notice Management' : 'Notice Impact Analysis';
      default:
        return 'NoticeLens';
    }
  };

  const getPageSubtitle = () => {
    if (currentView === 'notice-detail') {
      return `/student/notices/${selectedNoticeId}`;
    }
    switch (currentView) {
      case 'dashboard':
        return 'What do I need to act on today?';
      case 'notices':
        return 'All verified campus announcements with deterministic eligibility evaluation';
      case 'profile':
        return 'Your official academic record evaluated by the Python engine';
      case 'admin':
        return adminTab === 'notices'
          ? 'Upload source notice → Local Strands extraction → Review facts → Publish'
          : 'Deterministic evaluation breakdown across student cohort';
      default:
        return 'College Notice → Action Engine';
    }
  };

  const handleProfileSelect = async (newProfile) => {
    try {
      if (newProfile.role === 'Admin') {
        setActiveRole('Admin');
        setCurrentProfile(ADMIN_USER);
        setSelectedNoticeId(null);
        setSelectedNoticeDetail(null);
        setCurrentView('admin');
        window.history.pushState({}, '', '/admin');
        return;
      }
      setActiveRole('Student');
      const profileData = await getStudentById(newProfile.id);
      setCurrentProfile(profileData.student);
      if (currentView === 'admin') {
        setCurrentView('dashboard');
        window.history.pushState({}, '', '/student/dashboard');
      } else if (selectedNoticeId) {
        navigateToNotice(selectedNoticeId, profileData.student);
      }
    } catch (error) {
      setProfilesError(error.message || 'Unable to load the selected student profile');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        currentView={currentView === 'notice-detail' ? 'dashboard' : currentView}
        onSelectView={(view) => {
          setSelectedNoticeId(null);
          setSelectedNoticeDetail(null);
          setCurrentView(view);
          window.history.pushState({}, '', view === 'dashboard' ? '/student/dashboard' : `/${view}`);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentProfile={currentProfile}
      />

      <div className="main-wrapper">
        <Topbar
          pageTitle={getPageTitle()}
          subtitle={getPageSubtitle()}
          profiles={profiles}
          currentProfile={currentProfile}
          onSelectProfile={handleProfileSelect}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="content-area">
          {profilesLoading && <LoadingState count={1} />}
          {profilesError && (
            <ErrorState
              title="Student records unavailable"
              message={profilesError}
              onRetry={() => window.location.reload()}
            />
          )}
          {!profilesLoading && !profilesError && currentProfile && <>
          {/* ================= VIEW 1: STUDENT DASHBOARD ================= */}
          {currentView === 'dashboard' && (
            <StudentDashboard
              studentProfile={currentProfile}
              onNavigateNotice={navigateToNotice}
            />
          )}

          {/* ================= VIEW 2: NOTICE DETAIL (/student/notices/:id) ================= */}
          {currentView === 'notice-detail' && (
            noticeError ? (
              <ErrorState
                title="Notice evaluation unavailable"
                message={noticeError}
                onRetry={() => navigateToNotice(selectedNoticeId, currentProfile)}
              />
            ) : (
              <NoticeDetailView
                notice={selectedNoticeDetail}
                studentProfile={currentProfile}
                profiles={profiles}
                onBack={navigateToDashboard}
                onSelectProfile={handleProfileSelect}
              />
            )
          )}

          {/* ================= VIEW 3: NOTICES CATALOG ================= */}
          {currentView === 'notices' && (
            <NoticeSearch onNavigateNotice={(noticeId) => navigateToNotice(noticeId, currentProfile)} />
          )}

          {/* ================= VIEW 4: MY PROFILE ================= */}
          {currentView === 'profile' && (
            <div>
              <div className="profile-overview-card">
                <div className="profile-hero">
                  <div className="profile-large-avatar">
                    {currentProfile.avatarLetter}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {currentProfile.name}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {currentProfile.branchFullName} · Year {currentProfile.year || 'N/A'}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={currentProfile.cgpa !== null ? 'eligible' : 'needs-info'}
                  label={currentProfile.statusText}
                />
              </div>

              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                  Academic Credentials (Read by Deterministic Engine)
                </h3>

                <div className="profile-details-grid">
                  <div className="profile-prop">
                    <span className="profile-prop-label">Student ID</span>
                    <span className="profile-prop-value" style={{ fontFamily: 'var(--font-mono)' }}>
                      {currentProfile.id.toUpperCase()}
                    </span>
                  </div>

                  <div className="profile-prop">
                    <span className="profile-prop-label">Department</span>
                    <span className="profile-prop-value">{currentProfile.branch}</span>
                  </div>

                  <div className="profile-prop">
                    <span className="profile-prop-label">Current CGPA</span>
                    <span className="profile-prop-value" style={{
                      color: currentProfile.cgpa !== null ? 'var(--text-primary)' : 'var(--status-needs-info-text)',
                      fontWeight: 700
                    }}>
                      {currentProfile.cgpa !== null ? currentProfile.cgpa : 'Not Recorded'}
                    </span>
                  </div>

                  <div className="profile-prop">
                    <span className="profile-prop-label">Active Backlogs</span>
                    <span className="profile-prop-value" style={{
                      color: currentProfile.active_backlogs !== null ? 'var(--text-primary)' : 'var(--status-needs-info-text)'
                    }}>
                      {currentProfile.active_backlogs !== null ? currentProfile.active_backlogs : 'Not Recorded'}
                    </span>
                  </div>

                  <div className="profile-prop">
                    <span className="profile-prop-label">Academic Year</span>
                    <span className="profile-prop-value">{currentProfile.year ? `${currentProfile.year}th Year` : 'N/A'}</span>
                  </div>

                  <div className="profile-prop">
                    <span className="profile-prop-label">Verification Status</span>
                    <span className="profile-prop-value">
                      {currentProfile.cgpa !== null ? 'Institutional Verified' : 'Pending Transcripts'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deterministic Guarantee */}
              <div style={{
                backgroundColor: 'var(--bg-canvas)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px'
              }}>
                <Shield size={20} style={{ color: 'var(--color-brand-primary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Deterministic Python Execution Guarantee
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Your eligibility for campus placements and scholarships is computed strictly through mathematical rule evaluations in <code>eligibility_engine/engine.py</code>. AI models are strictly prohibited from determining student eligibility.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: ADMIN ================= */}
          {currentView === 'admin' && (
            currentProfile.role === 'Student' ? (
              <div className="admin-restricted-shell">
                <div className="admin-restricted-card">
                  <div className="admin-restricted-icon">
                    <ShieldAlert size={36} />
                  </div>
                  <h2>Admin Panel Restricted</h2>
                  <div className="admin-restricted-pill">
                    Active Profile: <strong>{currentProfile.name}</strong> · Student
                  </div>
                  <div className="admin-restricted-box">
                    <p><strong>Students cannot upload or publish college notices.</strong></p>
                    <p>Notice creation, file ingestion, fact extraction, and publishing are strictly restricted to administrative staff.</p>
                  </div>
                  <p className="admin-restricted-instruction">
                    To access the Admin Panel, upload notice files, review requirements, and publish opportunities for students, switch to the <strong>Admin User</strong> profile.
                  </p>
                  <button
                    type="button"
                    className="admin-restricted-switch-btn"
                    onClick={() => handleProfileSelect(ADMIN_USER)}
                  >
                    <Shield size={16} />
                    <span>Switch to Admin User</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="admin-nav-tabs" role="tablist" aria-label="Admin Navigation Tabs">
                  <button
                    type="button"
                    role="tab"
                    id="admin-tab-notices"
                    aria-controls="admin-panel-notices"
                    aria-selected={adminTab === 'notices'}
                    className={`admin-nav-tab-btn ${adminTab === 'notices' ? 'active' : ''}`}
                    onClick={() => setAdminTab('notices')}
                  >
                    <FileText size={15} />
                    <span>Notice Management</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="admin-tab-impact"
                    aria-controls="admin-panel-impact"
                    aria-selected={adminTab === 'impact'}
                    className={`admin-nav-tab-btn ${adminTab === 'impact' ? 'active' : ''}`}
                    onClick={() => setAdminTab('impact')}
                  >
                    <Shield size={15} />
                    <span>Cohort Impact Analysis</span>
                  </button>
                </div>

                <div
                  id="admin-panel-notices"
                  role="tabpanel"
                  aria-labelledby="admin-tab-notices"
                  style={{ display: adminTab === 'notices' ? 'block' : 'none' }}
                >
                  <AdminNoticeManager
                    onNavigateImpact={() => setAdminTab('impact')}
                    onViewAsStudent={() => {
                      const rahul = profiles.find((p) => p.id === 'rahul-sharma') || profiles[0];
                      handleProfileSelect(rahul);
                    }}
                  />
                </div>

                <div
                  id="admin-panel-impact"
                  role="tabpanel"
                  aria-labelledby="admin-tab-impact"
                  style={{ display: adminTab === 'impact' ? 'block' : 'none' }}
                >
                  <AdminImpactAnalysis />
                </div>
              </div>
            )
          )}
          </>}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
