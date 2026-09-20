import React, { useState } from 'react';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Building2
} from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * NoticeCard Component
 * Implements the prompt's exact card format:
 * - organization
 * - title
 * - opportunity type
 * - short description
 * - key eligibility requirements
 * - deadline
 * - personalized status
 * - action indicator
 * - expandable "Why am I seeing this?"
 * - navigation to /student/notices/:id
 * 
 * CRITICAL ARCHITECTURE RULE:
 * React does NOT calculate eligibility.
 * All eligibility values, why-seeing-this breakdown, and match metrics come
 * directly from the service/API layer.
 */
export const NoticeCard = ({ notice, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    id,
    organization = 'Campus Opportunity',
    title,
    opportunityType = 'Notice',
    shortDescription,
    keyRequirementsText = [],
    deadline,
    personalizedStatus = 'NOTICE',
    statusCategory = 'neutral',
    actionIndicator = 'View Details',
    whyAmISeeingThis = {},
    portalUrl
  } = notice;

  const {
    breakdown = [],
    matchSummary = ''
  } = whyAmISeeingThis;

  const handleCardClick = (e) => {
    // If the click happened on the expandable trigger, link, or action button, don't trigger card navigation
    if (
      e.target.closest('.why-seeing-trigger') ||
      e.target.closest('.action-link-btn') ||
      e.target.closest('button') ||
      e.target.closest('a')
    ) {
      return;
    }
    if (onNavigate) {
      onNavigate(id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!e.target.closest('button') && !e.target.closest('a')) {
        e.preventDefault();
        handleCardClick(e);
      }
    }
  };

  return (
    <article
      className={`notice-card status-${statusCategory}`}
      data-status={statusCategory}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Notice: ${title} by ${organization}. Status: ${personalizedStatus}`}
    >
      {/* Top row: Organization, Opportunity Type, and Personalized Status Badge */}
      <div className="notice-top-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="notice-org-badge">
              <Building2 size={12} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
              {organization}
            </span>
            <span className="category-tag">{opportunityType}</span>
          </div>
          <h3 className="notice-title-link">{title}</h3>
        </div>

        <StatusBadge status={statusCategory} label={personalizedStatus} />
      </div>

      {/* Short Description */}
      <p className="notice-desc">{shortDescription}</p>

      {/* Key Eligibility Requirements */}
      {keyRequirementsText.length > 0 && (
        <div className="key-requirements-container">
          <span className="key-req-label">Requirements:</span>
          {keyRequirementsText.map((req, idx) => (
            <span key={idx} className="key-req-pill">
              {req}
            </span>
          ))}
        </div>
      )}

      {/* Expandable: "Why am I seeing this?" */}
      <div className="why-seeing-box">
        <button
          type="button"
          className="why-seeing-trigger"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          aria-expanded={isExpanded}
        >
          <div className="why-seeing-trigger-left">
            <span style={{ color: 'var(--color-brand-primary)' }}>Why am I seeing this?</span>
          </div>
          <div className="why-seeing-trigger-right">
            {matchSummary && <span>{matchSummary}</span>}
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {isExpanded && (
          <div className="why-seeing-content">
            {breakdown.map((item, index) => (
              <div
                key={index}
                className={`why-item ${item.passed ? 'passed' : item.missing ? 'missing' : 'failed'}`}
              >
                {item.passed ? (
                  <CheckCircle2 size={15} className="why-icon" />
                ) : item.missing ? (
                  <AlertCircle size={15} className="why-icon" />
                ) : (
                  <XCircle size={15} className="why-icon" />
                )}
                <span>{item.label}</span>
              </div>
            ))}

            {matchSummary && (
              <div className="why-summary-badge">
                <span>{matchSummary}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar: Deadline and Action Indicator */}
      <div className="notice-bottom-bar">
        <div className="notice-bottom-left">
          <span className="deadline-badge">
            <Clock size={13} />
            <span>Deadline: <strong>{deadline}</strong></span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick Details navigation button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate) onNavigate(id);
            }}
          >
            <span>View Full Spec</span>
          </button>

          {/* Primary Action Button */}
          {statusCategory === 'eligible' && portalUrl ? (
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm action-link-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{actionIndicator}</span>
              <span className="btn-icon-bubble">
                <ArrowUpRight size={12} strokeWidth={2.5} />
              </span>
            </a>
          ) : (
            <button
              type="button"
              className={`btn btn-sm ${
                statusCategory === 'needs-info' ? 'btn-outline' : 'btn-ghost'
              }`}
              disabled={statusCategory === 'not-eligible'}
              style={statusCategory === 'not-eligible' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigate) onNavigate(id);
              }}
            >
              <span>{actionIndicator}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default NoticeCard;
