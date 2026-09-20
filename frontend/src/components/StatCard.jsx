import React from 'react';

/**
 * StatCard Component
 * High-restraint metric card for dashboard overview
 * @param {string} title
 * @param {string | number} value
 * @param {string} description
 * @param {React.ReactNode} icon
 */
export const StatCard = ({ title, value, description, icon }) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {icon && <div className="stat-icon-wrapper">{icon}</div>}
      </div>
      <div className="stat-value">{value}</div>
      {description && <div className="stat-description">{description}</div>}
    </div>
  );
};

export default StatCard;
