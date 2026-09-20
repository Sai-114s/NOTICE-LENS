import React from 'react';
import {
  LayoutDashboard,
  FileText,
  UserCheck,
  ShieldCheck,
  Compass
} from 'lucide-react';

/**
 * Sidebar Component
 * Left navigation panel for NoticeLens
 */
export const Sidebar = ({
  currentView = 'dashboard',
  onSelectView,
  isOpen = false,
  onClose,
  currentProfile
}) => {
  const isAdmin = currentProfile?.role === 'Admin';
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notices', label: 'Notices', icon: FileText },
    { id: 'profile', label: 'My Profile', icon: UserCheck },
    ...(isAdmin
      ? [
          {
            id: 'admin',
            label: 'Admin Panel',
            icon: ShieldCheck,
            badge: 'Active',
            badgeClass: 'active-admin'
          }
        ]
      : [])
  ];

  return (
    <>
      {isOpen && <div className="mobile-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation">
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <span>NL</span>
            </div>
            <div className="brand-meta">
              <span className="brand-title">NoticeLens</span>
              <span className="brand-badge">Build It · Local Engine</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectView(item.id);
                  if (onClose) onClose();
                }}
              >
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`nav-role-badge ${item.badgeClass || ''}`}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="principle-banner">
            <div className="principle-title">
              <Compass size={14} />
              <span>Core Principle</span>
            </div>
            <p className="principle-text">
              AI extracts information. Deterministic Python code decides eligibility.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
