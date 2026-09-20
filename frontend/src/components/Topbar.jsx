import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, Check } from 'lucide-react';

/**
 * Topbar Component
 * Header with page title, responsive toggle, and profile switcher
 */
export const Topbar = ({
  pageTitle = 'Dashboard',
  subtitle = 'Welcome to NoticeLens Action Engine',
  profiles = [],
  currentProfile,
  onSelectProfile,
  onToggleSidebar
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="page-title">{pageTitle}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Profile Switcher */}
        <div className="profile-switcher-container" ref={dropdownRef}>
          <button
            type="button"
            className="profile-switcher-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            <div className="profile-avatar">
              {currentProfile?.avatarLetter || 'NL'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{currentProfile?.name || 'Select Profile'}</span>
              <span className="profile-role">{currentProfile?.branch || currentProfile?.role}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', marginLeft: '4px' }} />
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown" role="listbox">
              <div className="dropdown-header">Switch Student Context</div>
              {profiles.map((profile) => {
                const isSelected = profile.id === currentProfile?.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`profile-option ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      onSelectProfile(profile);
                      setDropdownOpen(false);
                    }}
                  >
                    <div className="profile-option-left">
                      <div className="option-avatar">{profile.avatarLetter}</div>
                      <div>
                        <div className="option-name">{profile.name}</div>
                        <div className="option-meta">
                          {profile.branch} {profile.year ? `· Year ${profile.year}` : ''}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} style={{ color: 'var(--color-brand-primary)' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
