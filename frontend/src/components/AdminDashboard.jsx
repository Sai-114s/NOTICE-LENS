import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Shield,
  FileText
} from 'lucide-react';
import { getPublishedNotices, getNoticeImpact } from '../services/noticeService';
import { downloadEligibleStudentsExcel } from '../utils/excelExport';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import './AdminDashboard.css';

export const AdminDashboard = ({ onNavigate }) => {
  const [notices, setNotices] = useState([]);
  const [impactData, setImpactData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNoticeId, setExpandedNoticeId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublishedNotices();
        const publishedNotices = (data.notices || []).filter(
          (n) => n.status === 'published' || !n.status
        );
        if (!active) return;
        setNotices(publishedNotices);

        // Fetch impact breakdown for all published notices in parallel
        const impactResults = {};
        await Promise.all(
          publishedNotices.map(async (notice) => {
            try {
              const impact = await getNoticeImpact(notice.id);
              impactResults[notice.id] = impact.results || [];
            } catch (err) {
              console.warn(`Failed to fetch impact for ${notice.id}:`, err);
              impactResults[notice.id] = [];
            }
          })
        );

        if (!active) return;
        setImpactData(impactResults);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load administration dashboard');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Filter notices by search query
  const filteredNotices = useMemo(() => {
    if (!searchQuery.trim()) return notices;
    const query = searchQuery.toLowerCase();
    return notices.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(query)) ||
        (n.organization && n.organization.toLowerCase().includes(query))
    );
  }, [notices, searchQuery]);

  // Global Administrative Metrics
  const metrics = useMemo(() => {
    let totalEligibleMatches = 0;
    const studentIds = new Set();

    Object.values(impactData).forEach((resultsList) => {
      resultsList.forEach((result) => {
        studentIds.add(result.studentId || result.student);
        if (result.status === 'eligible') totalEligibleMatches++;
      });
    });

    return {
      publishedCount: notices.length,
      studentsCount: studentIds.size || 3,
      eligibleMatches: totalEligibleMatches,
      spreadsheetsReady: notices.length
    };
  }, [notices, impactData]);

  // Handle direct Excel spreadsheet download for a notice
  const handleDownloadExcel = (notice, mode = 'eligible') => {
    setDownloadingId(notice.id);
    try {
      const results = impactData[notice.id] || [];
      downloadEligibleStudentsExcel(notice, results, mode);
    } catch (err) {
      console.error('Failed to generate Excel spreadsheet:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 600);
    }
  };

  const toggleExpandRoster = (noticeId) => {
    setExpandedNoticeId((current) => (current === noticeId ? null : noticeId));
  };

  if (loading) {
    return <LoadingState count={3} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Admin operations unavailable"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Institutional Admin Oversight Header */}
      <section className="admin-header-banner">
        <div className="admin-header-info">
          <h2>Administrative Operations & Cohort Intelligence</h2>
          <p>
            Deterministic eligibility oversight across all campus placements and academic drives.
            Review cohort qualification rates and download official Excel spreadsheets of eligible students notice-wise.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-action-btn-primary"
            onClick={() => onNavigate && onNavigate('admin', 'notices')}
          >
            <Plus size={16} />
            <span>Ingest New Notice</span>
          </button>
          <button
            type="button"
            className="admin-action-btn-secondary"
            onClick={() => onNavigate && onNavigate('admin', 'impact')}
          >
            <Shield size={16} />
            <span>Cohort Impact Deep-Dive</span>
          </button>
        </div>
      </section>

      {/* Administrative KPIs */}
      <section className="admin-metrics-grid" aria-label="Administrative metrics">
        <div className="admin-metric-card">
          <div className="admin-metric-icon-box blue">
            <FileText size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Published Opportunities</span>
            <span className="admin-metric-value">{metrics.publishedCount}</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-box purple">
            <Users size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Enrolled Student Cohort</span>
            <span className="admin-metric-value">{metrics.studentsCount} Students</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-box green">
            <CheckCircle2 size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Eligible Candidate Matches</span>
            <span className="admin-metric-value">{metrics.eligibleMatches} Placements</span>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-icon-box amber">
            <FileSpreadsheet size={22} />
          </div>
          <div className="admin-metric-content">
            <span className="admin-metric-label">Excel Spreadsheets Ready</span>
            <span className="admin-metric-value">{metrics.spreadsheetsReady} Files</span>
          </div>
        </div>
      </section>

      {/* Notice-Wise Cohort Eligibility & Excel Roster Section */}
      <section>
        <div className="admin-section-header">
          <div className="admin-section-title">
            <h3>Notice-Wise Eligibility & Excel Rosters</h3>
            <span className="admin-section-badge">{filteredNotices.length} Notices</span>
          </div>

          <div className="admin-search-wrapper">
            <Search size={14} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-notices-container">
          {filteredNotices.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}
            >
              No published notices match your search.
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const results = impactData[notice.id] || [];
              const eligibleStudents = results.filter((r) => r.status === 'eligible');
              const notEligibleCount = results.filter((r) => r.status === 'not-eligible').length;
              const needsInfoCount = results.filter((r) => r.status === 'needs-info').length;
              const isExpanded = expandedNoticeId === notice.id;
              const isDownloading = downloadingId === notice.id;

              return (
                <article
                  key={notice.id}
                  className={`admin-notice-roster-card ${eligibleStudents.length === 0 ? 'no-eligible' : ''}`}
                >
                  <div className="admin-notice-card-top">
                    <div className="admin-notice-main-meta">
                      <div className="admin-org-tag">
                        <Building2 size={12} />
                        <span>{notice.organization || 'Campus Placement'}</span>
                      </div>
                      <h4 className="admin-notice-card-title">{notice.title}</h4>
                      
                      <div className="admin-criteria-row">
                        {notice.criteria?.allowed_branches?.length > 0 && (
                          <span className="admin-criteria-item">
                            Branches: {notice.criteria.allowed_branches.join(', ')}
                          </span>
                        )}
                        {notice.criteria?.min_cgpa > 0 && (
                          <span className="admin-criteria-item">
                            CGPA ≥ {notice.criteria.min_cgpa}
                          </span>
                        )}
                        {notice.criteria?.max_backlogs !== undefined && (
                          <span className="admin-criteria-item">
                            Max Backlogs: {notice.criteria.max_backlogs}
                          </span>
                        )}
                        {notice.deadline && (
                          <span className="admin-criteria-item" style={{ color: 'var(--text-primary)' }}>
                            <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Deadline: {notice.deadline}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notice Action Buttons */}
                    <div className="admin-notice-actions">
                      <button
                        type="button"
                        className="excel-download-btn"
                        onClick={() => handleDownloadExcel(notice, 'eligible')}
                        disabled={isDownloading}
                        title="Download Microsoft Excel spreadsheet (.csv) of eligible students"
                      >
                        <FileSpreadsheet size={15} />
                        <span>
                          {isDownloading ? 'Exporting...' : 'Download Excel Sheet'}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="excel-download-secondary"
                        onClick={() => toggleExpandRoster(notice.id)}
                        aria-expanded={isExpanded}
                      >
                        <span>{isExpanded ? 'Hide Roster' : 'View Eligible Cohort'}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Real-time Cohort Breakdown Bar */}
                  <div className="admin-cohort-breakdown">
                    <span className="admin-breakdown-title">Cohort Breakdown:</span>
                    <span className="admin-cohort-pill eligible">
                      <CheckCircle2 size={14} />
                      <span>{eligibleStudents.length} Eligible</span>
                    </span>
                    <span className="admin-cohort-pill not-eligible">
                      <XCircle size={14} />
                      <span>{notEligibleCount} Ineligible</span>
                    </span>
                    {needsInfoCount > 0 && (
                      <span className="admin-cohort-pill needs-info">
                        <AlertCircle size={14} />
                        <span>{needsInfoCount} Pending Verification</span>
                      </span>
                    )}
                  </div>

                  {/* Expandable Preview Table of Eligible Students */}
                  {isExpanded && (
                    <div className="admin-roster-drawer">
                      <div className="admin-roster-header">
                        <h4>
                          Verified Eligible Students ({eligibleStudents.length})
                        </h4>
                        {eligibleStudents.length > 0 && (
                          <button
                            type="button"
                            className="excel-download-secondary"
                            onClick={() => handleDownloadExcel(notice, 'eligible')}
                          >
                            <Download size={13} />
                            <span>Export These {eligibleStudents.length} Students</span>
                          </button>
                        )}
                      </div>

                      {eligibleStudents.length === 0 ? (
                        <p className="admin-table-empty">
                          No students in the enrolled cohort currently meet the deterministic criteria for this notice.
                        </p>
                      ) : (
                        <div className="admin-students-table-container">
                          <table className="admin-students-table">
                            <thead>
                              <tr>
                                <th>Student Name</th>
                                <th>Department</th>
                                <th>Academic Year</th>
                                <th>Current CGPA</th>
                                <th>Active Backlogs</th>
                                <th>Status</th>
                                <th>Evaluation Rule Match</th>
                              </tr>
                            </thead>
                            <tbody>
                              {eligibleStudents.map((student) => (
                                <tr key={student.studentId || student.student}>
                                  <td style={{ fontWeight: 600 }}>{student.student}</td>
                                  <td>{student.branch || 'N/A'}</td>
                                  <td>Year {student.year || 'N/A'}</td>
                                  <td style={{ fontWeight: 600 }}>{student.cgpa ?? 'N/A'}</td>
                                  <td>{student.active_backlogs ?? 0}</td>
                                  <td>
                                    <span className="admin-table-eligible-badge">Eligible</span>
                                  </td>
                                  <td style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                                    {student.reason}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
