import React from 'react';
import { ArrowUpRight } from 'lucide-react';

/**
 * ActionItem Component
 * Call to action button with button-in-button nested trailing icon
 * @param {string} label
 * @param {string} url
 * @param {'primary' | 'secondary' | 'outline'} type
 * @param {function} onClick
 */
export const ActionItem = ({
  label,
  url = '#',
  type = 'primary',
  onClick,
  disabled = false
}) => {
  const btnClass = `btn btn-${type}`;

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a
      href={url}
      target={url.startsWith('http') ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className={btnClass}
      onClick={handleClick}
      style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
    >
      <span>{label}</span>
      <span className="btn-icon-bubble">
        <ArrowUpRight size={13} strokeWidth={2.5} />
      </span>
    </a>
  );
};

export default ActionItem;
