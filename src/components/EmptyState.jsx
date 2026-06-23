import React from 'react';

export default function EmptyState({ icon = '◌', title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {sub && <p className="empty-state-sub">{sub}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
