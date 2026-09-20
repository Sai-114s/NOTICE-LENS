import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

/**
 * RequirementRow Component
 * Displays a single evaluated criterion (CGPA, Branch, Backlogs, etc.)
 * @param {string} label - Name of the requirement (e.g., 'Min CGPA', 'Branches Allowed')
 * @param {string} requiredValue - The rule value specified in the notice
 * @param {string} studentValue - The student's actual value
 * @param {'pass' | 'fail' | 'unknown'} status - Outcome of rule check
 */
export const RequirementRow = ({
  label,
  requiredValue,
  studentValue,
  status = 'unknown'
}) => {
  const renderIcon = () => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 size={15} className="req-icon-pass" />;
      case 'fail':
        return <XCircle size={15} className="req-icon-fail" />;
      case 'unknown':
      default:
        return <AlertCircle size={15} className="req-icon-unknown" />;
    }
  };

  return (
    <div className="requirement-row">
      <div className="req-left">
        {renderIcon()}
        <span>{label}: <strong>{requiredValue}</strong></span>
      </div>
      {studentValue !== undefined && studentValue !== null && (
        <div className="req-right">
          <span>Your record:</span>
          <span className="req-student-val">{studentValue}</span>
        </div>
      )}
    </div>
  );
};

export default RequirementRow;
