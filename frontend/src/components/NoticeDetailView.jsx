import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  Shield,
  ChevronDown,
  ChevronUp,
  Check,
  Info
} from 'lucide-react';
import { completeActionItem } from '../services/actionItemService';

const EMPTY_ACTIONS = [];

/**
 * NoticeDetailView Component
 * 
 * The most important NoticeLens screen:
 * Student → Notice → Personalized Explanation
 * 
 * Immediately answers:
 * 1. Am I eligible?
 * 2. Why?
 * 3. What do I need to do?
 * 4. When is it due?
 * 
 * CRITICAL ARCHITECTURE RULE:
 * React does NOT calculate eligibility.
 * All eligibility checks, requirement verdicts, action items, and deadline parsing
 * are computed server-side by the deterministic Python engine and consumed via props.
 */
export const NoticeDetailView = ({
  notice,
  studentProfile,
  profiles = [],
  onBack,
  onSelectProfile
}) => {
  const noticeData = notice || {};
  const {
    organization = 'Campus Placement Cell',
    title = 'Notice Title',
    opportunityType = 'General',
    shortDescription = '',
    deadline = 'Upcoming',
    personalizedStatus = 'YOU ARE ELIGIBLE',
    statusCategory = 'eligible',
    requirements = [],
    whyAmISeeingThis = {},
    actionPlan = EMPTY_ACTIONS,
    deadlineInfo = {},
    application_url = null
  } = noticeData;

  // Local state for expandable "Why am I seeing this?"
  const [whyExpanded, setWhyExpanded] = useState(false);

  // Local state for interactive action plan checklist completion overrides
  const [locallyCompleted, setLocallyCompleted] = useState({});
  const [pendingActions, setPendingActions] = useState({});
  const [actionError, setActionError] = useState(null);

  const isActionCompleted = (actionId, defaultCompleted) => {
    if (locallyCompleted[actionId] !== undefined) {
      return locallyCompleted[actionId];
    }
    return Boolean(defaultCompleted);
  };

  const toggleAction = async (actionId, currentStatus) => {
    if (currentStatus || pendingActions[actionId]) return;
    setActionError(null);
    setLocallyCompleted((prev) => ({
      ...prev,
      [actionId]: true
    }));
    setPendingActions((prev) => ({ ...prev, [actionId]: true }));
    try {
      await completeActionItem(noticeData.id, actionId, studentProfile?.id);
    } catch (error) {
      setLocallyCompleted((prev) => ({ ...prev, [actionId]: false }));
      setActionError(error.message || 'Unable to save action progress');
    } finally {
      setPendingActions((prev) => ({ ...prev, [actionId]: false }));
    }
  };

  if (!notice) {
    return (
      <div className="detail-view-container" style={{ padding: '64px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Notice not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          The requested campus notice could not be retrieved.
        </p>
        <button type="button" className="btn-back" onClick={onBack}>
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  const completedCount = actionPlan.filter((action, index) => {
    const actionId = action.id || `action-${index}`;
    return isActionCompleted(actionId, action.completed);
  }).length;
  const totalActions = actionPlan.length;
  const progressPercent = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;

  // Match breakdown details from backend
  const reasonsList = whyAmISeeingThis.reasons || whyAmISeeingThis.breakdown || [];
  const matchSummary = whyAmISeeingThis.matchSummary || `${whyAmISeeingThis.matchedCount || 0}/${whyAmISeeingThis.totalCount || requirements.length} requirements matched`;

  // Status-specific headline text and supportive explanation
  const getStatusExplanation = () => {
    if (statusCategory === 'eligible') {
      return `All verified academic and departmental requirements match the official criteria for ${studentProfile?.name || 'your profile'}.`;
    }
    if (statusCategory === 'needs-info') {
      const missingField = noticeData.engineAudit?.missing_information?.[0] || requirements.find((r) => r.status === 'missing')?.name;
      if (missingField) {
        return `Missing information: ${missingField}. Please update your academic records in your student profile.`;
      }
      return 'Your academic record is missing essential data needed by the Python engine to evaluate eligibility.';
    }
    const failedReason = noticeData.engineAudit?.reasons?.[0] || requirements.find((r) => r.status === 'fail')?.detail;
    if (failedReason) {
      return failedReason;
    }
    return 'One or more academic prerequisites or departmental restrictions were not met by your institutional record.';
  };

  return (
    <div className="detail-view-container">
      {/* ================= 1. NAV BAR & BREADCRUMB ================= */}
      <div className="detail-nav-bar">
        <button
          type="button"
          className="btn-back"
          onClick={onBack}
          aria-label="Back to notices list"
        >
          <ArrowLeft size={14} />
          <span>Back to Notices</span>
        </button>

        <div className="detail-breadcrumb">
          <span>Student</span>
          <span>/</span>
          <span>Notices</span>
          <span>/</span>
          <span className="active-crumb">{organization}</span>
        </div>
      </div>

      {/* ================= 2. TOP SECTION ================= */}
      <div className="detail-header-card">
        <div className="detail-meta-row">
          <div className="detail-meta-left">
            <span className="detail-org-badge">
              <Building2 size={13} />
              <span>{organization}</span>
            </span>
            <span className="detail-category-badge">{opportunityType}</span>
          </div>

          <div className="deadline-badge">
            <Clock size={13} />
            <span>Deadline: <strong>{deadline}</strong></span>
          </div>
        </div>

        <h1 className="detail-title">{title}</h1>

        {shortDescription && (
          <p className="detail-desc">{shortDescription}</p>
        )}
      </div>

      {/* ================= 3. PRIMARY STATUS CARD (FOCAL POINT) ================= */}
      <div className={`status-hero-shell status-${statusCategory}`} role="region" aria-label="Eligibility Verdict">
        <div className="status-hero-core">
          <div className="status-hero-header">
            <div className="status-headline-badge">
              {statusCategory === 'eligible' && <CheckCircle2 size={16} />}
              {statusCategory === 'not-eligible' && <XCircle size={16} />}
              {statusCategory === 'needs-info' && <HelpCircle size={16} />}
              <span>{personalizedStatus}</span>
            </div>

            <div className="status-engine-pill">
              <Shield size={13} />
              <span>Deterministic Python Rule Evaluation</span>
            </div>
          </div>

          <h2 className="status-hero-title">
            {statusCategory === 'eligible' && 'You are eligible for this opportunity'}
            {statusCategory === 'not-eligible' && 'Not eligible based on institutional criteria'}
            {statusCategory === 'needs-info' && 'Eligibility needs more information'}
          </h2>

          <p className="status-hero-subtitle">
            {getStatusExplanation()}
          </p>
        </div>
      </div>

      {/* ================= 4. REQUIREMENT-BY-REQUIREMENT RESULTS ================= */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Eligibility Criteria Results</h2>
          <p className="section-subtitle">
            Evaluated deterministically against official academic records for <strong>{studentProfile?.name}</strong> ({studentProfile?.branch}, {studentProfile?.year ? `${studentProfile?.year}th year` : 'Year N/A'})
          </p>
        </div>

        <div className="requirements-list">
          {requirements.map((req, idx) => {
            const isPass = req.status === 'pass';
            const isFail = req.status === 'fail';
            const isMissing = req.status === 'missing';

            return (
              <div key={idx} className="req-detail-row">
                <div className="req-detail-left">
                  <div className={`req-icon-circle ${req.status}`}>
                    {isPass && '✓'}
                    {isFail && '✕'}
                    {isMissing && '?'}
                  </div>

                  <div className="req-info-block">
                    <span className="req-name-label">{req.name}</span>
                    <span className="req-detail-text">{req.detail}</span>
                  </div>
                </div>

                <div>
                  <span className={`req-status-pill ${req.status}`}>
                    {isPass && 'Accepted'}
                    {isFail && 'Not Eligible'}
                    {isMissing && 'Needs Data'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 5. EXPANDABLE: "WHY AM I SEEING THIS?" ================= */}
      <div className="why-accordion-card">
        <button
          type="button"
          className="why-accordion-btn"
          onClick={() => setWhyExpanded(!whyExpanded)}
          aria-expanded={whyExpanded}
        >
          <div className="why-accordion-title">
            <span>Why am I seeing this?</span>
            <span className="why-match-badge">{matchSummary}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>
              {whyExpanded ? 'Hide details' : 'Show details'}
            </span>
            {whyExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {whyExpanded && (
          <div className="why-content-expanded">
            <div className="why-reasons-list">
              {reasonsList.map((reason, idx) => {
                const isPass = reason.passed;
                const isMissing = reason.missing;
                const iconType = isPass ? 'pass' : isMissing ? 'missing' : 'fail';

                return (
                  <div key={idx} className="why-reason-item">
                    <div className={`why-reason-icon ${iconType}`}>
                      {isPass ? '✓' : isMissing ? '?' : '✕'}
                    </div>
                    <span>{reason.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================= 6. ACTION PLAN (INTERACTIVE CHECKLIST) ================= */}
      <div className="section-card">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 className="section-title">Action Plan</h2>
            <p className="section-subtitle">
              Follow these recommended preparatory steps before registering
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="checklist-progress-text">
              {completedCount} of {totalActions} completed
            </span>
          </div>
        </div>

        <div className="action-plan-checklist">
          {actionPlan.map((action, index) => {
            const actionId = action.id || `action-${index}`;
            const actionLabel = action.label || action.text || action;
            const isChecked = isActionCompleted(actionId, action.completed);

            return (
              <button
                type="button"
                key={actionId}
                className={`checklist-item ${isChecked ? 'completed' : ''}`}
                onClick={() => toggleAction(actionId, isChecked)}
                disabled={Boolean(pendingActions[actionId])}
                role="checkbox"
                aria-checked={isChecked}
              >
                <div className="checklist-box">
                  {isChecked && <Check size={13} strokeWidth={3} />}
                </div>
                <span className="checklist-label">{actionLabel}</span>
              </button>
            );
          })}
        </div>

        {actionError && <p className="section-subtitle" role="alert" style={{ color: 'var(--status-not-eligible-text)', marginTop: '12px' }}>{actionError}</p>}

        {totalActions > 0 && (
          <div className="checklist-progress-bar-wrap">
            <div className="checklist-progress-bar">
              <div
                className="checklist-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="checklist-progress-text">{progressPercent}%</span>
          </div>
        )}
      </div>

      {/* ================= 7. DEADLINE SECTION ================= */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Submission Deadline & Schedule</h2>
          <p className="section-subtitle">
            Key timing coordinates for registration and document upload
          </p>
        </div>

        <div className="deadline-card-grid">
          <div className="deadline-cell">
            <div className="deadline-cell-label">Date</div>
            <div className="deadline-cell-val">{deadlineInfo.date || deadline}</div>
          </div>

          <div className="deadline-cell">
            <div className="deadline-cell-label">Time</div>
            <div className="deadline-cell-val">{deadlineInfo.time || '11:59 PM'}</div>
          </div>

          <div className="deadline-cell">
            <div className="deadline-cell-label">Urgency Indicator</div>
            <div style={{ marginTop: '2px' }}>
              <span className={`urgency-pill ${deadlineInfo.isUrgent ? 'urgent' : (deadlineInfo.deadlineDays <= 7 ? 'approaching' : 'standard')}`}>
                <Clock size={12} />
                <span>{deadlineInfo.relativeUrgency || `${deadlineInfo.deadlineDays || 0} days remaining`}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 8. ACTION FOOTER (Apply Now ONLY if application_url exists) ================= */}
      <div className="detail-footer-bar">
        <button type="button" className="btn-back" onClick={onBack}>
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>

        {/* 
          CRITICAL CONSTRAINT:
          "Show 'Apply Now' ONLY when application_url exists."
        */}
        {application_url ? (
          <a
            href={application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-apply-cta"
            id="apply-now-btn"
          >
            <span>Apply Now</span>
            <div className="btn-icon-wrapper-circle">
              <ArrowUpRight size={13} strokeWidth={2.5} />
            </div>
          </a>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            <Info size={14} />
            <span>Direct institutional notice · No external application link</span>
          </div>
        )}
      </div>

      {/* ================= 9. QUICK PROFILE SWITCHER (For testing all 3 states) ================= */}
      <div className="test-profile-bar">
        <div>
          <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
            Instant State Verification:
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '6px' }}>
            Switch student profiles to test deterministic engine verdicts
          </span>
        </div>

        <div className="test-profile-pills">
          {profiles.map((profile) => {
            const isActive = studentProfile?.id === profile.id;

            return (
              <button
                key={profile.id}
                type="button"
                className={`test-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectProfile && onSelectProfile(profile)}
              >
                <span>{profile.name}</span>
                <span style={{ opacity: 0.8, fontSize: '11px', marginLeft: '4px' }}>
                  ({profile.branch})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NoticeDetailView;
