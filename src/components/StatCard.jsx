import React from 'react';

export default function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card stat-card">
      <div className="card-title">{label}</div>
      <div className="card-value mono" style={accent ? { color: accent } : undefined}>
        {value ?? '—'}
      </div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}
