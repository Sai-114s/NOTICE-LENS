import React from 'react';
import { Clock } from 'lucide-react';

/**
 * DeadlineBadge Component
 * Displays application or submission deadlines with clock icon
 * @param {string} deadline
 * @param {boolean} isUrgent
 */
export const DeadlineBadge = ({ deadline, isUrgent = false, className = '' }) => {
  return (
    <span className={`deadline-badge ${isUrgent ? 'urgent' : ''} ${className}`}>
      <Clock size={13} strokeWidth={2} />
      <span>Deadline: {deadline}</span>
    </span>
  );
};

export default DeadlineBadge;
