import React from 'react';

/**
 * StatusBadge Component
 * Semantic color badges for eligibility verdicts and statuses
 * @param {'eligible' | 'needs-info' | 'not-eligible' | 'neutral' | 'pending'} status
 * @param {string} label
 */
export const StatusBadge = ({ status = 'neutral', label, className = '' }) => {
  const getDisplayLabel = () => {
    if (label) return label;
    switch (status) {
      case 'eligible':
        return 'Eligible';
      case 'needs-info':
        return 'Needs Information';
      case 'not-eligible':
        return 'Not Eligible';
      case 'pending':
        return 'Under Review';
      default:
        return 'Notice';
    }
  };

  return (
    <span className={`status-badge ${status} ${className}`}>
      <span className="status-badge-dot" aria-hidden="true" />
      <span>{getDisplayLabel()}</span>
    </span>
  );
};

export default StatusBadge;
