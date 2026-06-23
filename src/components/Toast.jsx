import React from 'react';

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => onRemove(t.id)}>
          <span className="toast-icon">{ICONS[t.type] ?? 'ℹ'}</span>
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
