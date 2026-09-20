import React from 'react';

/**
 * LoadingState Component
 * Restrained subtle skeleton loading view
 */
export const LoadingState = ({ count = 2 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="loading-state">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-box" />
        </div>
      ))}
    </div>
  );
};

export default LoadingState;
