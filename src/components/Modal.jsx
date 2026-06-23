import React, { useEffect } from 'react';

export default function Modal({ title, onClose, children, actions }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="flex items-center justify-between mb-16">
          <h2 className="modal-title" style={{ marginBottom: 0 }}>{title}</h2>
          <button className="btn btn-ghost btn-sm btn-icon" id="btn-modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}
