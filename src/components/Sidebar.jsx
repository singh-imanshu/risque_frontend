import React from 'react';

const NAV = [
  { id: 'dashboard',  icon: '⬡', label: 'Dashboard'  },
  { id: 'portfolios', icon: '◧', label: 'Portfolios'  },
  { id: 'analytics',  icon: '◈', label: 'Analytics'   },
];

export default function Sidebar({ page, onNav, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">RISQUÉ</div>
        <div className="logo-sub">RISK ANALYTICS</div>
      </div>

      <nav className="nav-section">
        <div className="nav-label">Navigation</div>
        {NAV.map((n) => (
          <button
            key={n.id}
            id={`nav-${n.id}`}
            className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => onNav(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-text">{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user" title={user}>
            <span className="user-dot" />
            <span>{user.length > 20 ? user.slice(0, 20) + '…' : user}</span>
          </div>
        )}
        <button className="nav-item" id="btn-logout" onClick={onLogout}>
          <span className="nav-icon">⏻</span>
          <span className="nav-text">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
