import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState Component
 * Editorial, restrained empty state view
 */
export const EmptyState = ({
  title = 'No notices found',
  description = 'There are no active notices matching your current filter criteria.',
  icon: Icon = Inbox,
  actionLabel,
  onAction
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
