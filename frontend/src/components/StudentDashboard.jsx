import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  Compass
} from 'lucide-react';
import StatCard from './StatCard';
import NoticeCard from './NoticeCard';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import { getStudentDashboardData } from '../services/eligibilityService';

/**
 * StudentDashboard Component
 * Prioritizes the question: "What do I need to act on today?"
 * 
 * Header:
 * - Good morning, [Name] 👋
 * - Here are the college opportunities and notices that matter to you.
 * 
 * Stats:
 * - Relevant Notices
 * - Eligible
 * - Needs Information
 * - Deadlines This Week
 * 
 * Filters:
 * - All
 * - Eligible
 * - Needs Information
 * - Not Eligible
 * 
 * Search:
 * - Filters by keyword across organization, title, and requirements
 * 
 * CRITICAL ARCHITECTURE RULE:
 * React does NOT calculate eligibility.
 * All eligibility checks and results are consumed from the service/API layer.
 */
export const StudentDashboard = ({ studentProfile, onNavigateNotice }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({ notices: [], stats: {} });
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch dashboard data from the service layer whenever studentProfile changes
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentDashboardData(studentProfile);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
      setError(err.message || 'Unable to fetch evaluated notices');
    } finally {
      setLoading(false);
    }
  }, [studentProfile]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Compute greeting based on time of day
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const studentFirstName = studentProfile?.name ? studentProfile.name.split(' ')[0] : 'Student';
  const { notices = [], stats = {} } = dashboardData;

  // Filter notices based on status tab and search text
  const filteredNotices = notices.filter((notice) => {
    // Search filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (notice.organization && notice.organization.toLowerCase().includes(q)) ||
      (notice.title && notice.title.toLowerCase().includes(q)) ||
      (notice.shortDescription && notice.shortDescription.toLowerCase().includes(q)) ||
      (notice.opportunityType && notice.opportunityType.toLowerCase().includes(q)) ||
      (notice.keyRequirementsText &&
        notice.keyRequirementsText.some((req) => req.toLowerCase().includes(q)));

    // Status filter
    let matchesStatus = true;
    if (selectedFilter === 'ELIGIBLE') {
      matchesStatus = notice.statusCategory === 'eligible';
    } else if (selectedFilter === 'NEEDS_INFO') {
      matchesStatus = notice.statusCategory === 'needs-info';
    } else if (selectedFilter === 'NOT_ELIGIBLE') {
      matchesStatus = notice.statusCategory === 'not-eligible';
    }

    return matchesSearch && matchesStatus;
  });

  // Calculate counts for filter pills directly from API notices
  const eligibleCount = notices.filter((n) => n.statusCategory === 'eligible').length;
  const needsInfoCount = notices.filter((n) => n.statusCategory === 'needs-info').length;
  const notEligibleCount = notices.filter((n) => n.statusCategory === 'not-eligible').length;

  return (
    <div>
      {/* Priority Question Eyebrow & Student Header */}
      <div className="priority-banner">
        <div className="priority-eyebrow">
          <Compass size={13} />
          <span>Action Engine · What do I need to act on today?</span>
        </div>

        <h1 className="dashboard-greeting">
          {getGreetingTime()}, {studentFirstName}
        </h1>

        <p className="dashboard-subheading">
          Here are the college opportunities and notices that matter to you.
        </p>
      </div>

      {/* Error Banner if service fails */}
      {error && (
        <ErrorState
          title="Notice Evaluation Service Error"
          message={`Failed to retrieve evaluation results from local Python engine: ${error}`}
          onRetry={loadDashboard}
        />
      )}

      {/* 4 Stat Cards */}
      <div className="stat-card-grid">
        <StatCard
          title="Relevant Notices"
          value={loading ? '-' : stats.relevantNotices ?? notices.length}
          description="Matched to your campus profile"
          icon={<FileText size={18} />}
        />
        <StatCard
          title="Eligible"
          value={loading ? '-' : stats.eligible ?? eligibleCount}
          description="Verified by deterministic Python engine"
          icon={<CheckCircle2 size={18} style={{ color: 'var(--status-eligible-dot)' }} />}
        />
        <StatCard
          title="Needs Information"
          value={loading ? '-' : stats.needsInformation ?? needsInfoCount}
          description="Requires data update or verification"
          icon={<AlertCircle size={18} style={{ color: 'var(--status-needs-info-dot)' }} />}
        />
        <StatCard
          title="Deadlines This Week"
          value={loading ? '-' : stats.deadlinesThisWeek ?? 0}
          description="Requires attention before expiry"
          icon={<Calendar size={18} />}
        />
      </div>

      {/* Search & Filters Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-pills-row" role="tablist" aria-label="Notice status filters">
          <button
            type="button"
            role="tab"
            aria-selected={selectedFilter === 'ALL'}
            className={`filter-pill-btn ${selectedFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('ALL')}
          >
            <span>All</span>
            <span className="filter-count">{notices.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedFilter === 'ELIGIBLE'}
            className={`filter-pill-btn ${selectedFilter === 'ELIGIBLE' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('ELIGIBLE')}
          >
            <span>Eligible</span>
            <span className="filter-count">{eligibleCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedFilter === 'NEEDS_INFO'}
            className={`filter-pill-btn ${selectedFilter === 'NEEDS_INFO' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('NEEDS_INFO')}
          >
            <span>Needs Information</span>
            <span className="filter-count">{needsInfoCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedFilter === 'NOT_ELIGIBLE'}
            className={`filter-pill-btn ${selectedFilter === 'NOT_ELIGIBLE' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('NOT_ELIGIBLE')}
          >
            <span>Not Eligible</span>
            <span className="filter-count">{notEligibleCount}</span>
          </button>
        </div>

        {/* Notice Search Input */}
        <div className="search-container">
          <Search size={15} className="search-icon-fixed" />
          <input
            type="text"
            className="search-input"
            placeholder="Search notices by company, role, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search college notices"
          />
        </div>
      </div>

      {/* Main Notice List Section */}
      {loading ? (
        <LoadingState count={3} />
      ) : filteredNotices.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredNotices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onNavigate={onNavigateNotice}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={searchQuery ? `No notices matching "${searchQuery}"` : 'No notices in this category'}
          description="Try switching the filter tab or modifying your search query to see other college opportunities."
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedFilter('ALL');
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
