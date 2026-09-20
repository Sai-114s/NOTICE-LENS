import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorState Component
 * Restrained error banner with retry action
 */
export const ErrorState = ({
  title = 'Failed to load notices',
  message = 'An error occurred while connecting to the local NoticeLens engine.',
  onRetry
}) => {
  return (
    <div className="error-state" role="alert">
      <AlertTriangle size={20} className="error-icon" />
      <div style={{ flex: 1 }}>
        <h4 className="error-title">{title}</h4>
        <p className="error-desc">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRetry}
          style={{ borderColor: 'var(--status-not-eligible-border)', color: 'var(--status-not-eligible-text)' }}
        >
          <RefreshCw size={13} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
