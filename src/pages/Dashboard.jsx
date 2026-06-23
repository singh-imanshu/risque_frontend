import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ScatterChart, Scatter,
} from 'recharts';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fmt } from '../utils/fmt.js';

const COLORS = ['#00D4AA', '#4B9EFF', '#F5A623', '#FF4B6E', '#9B6BFF', '#00C49F', '#FFBB28'];

const TIP_STYLE = {
  background: '#141928', border: '1px solid #1E2640',
  borderRadius: 10, fontSize: 12, fontFamily: 'JetBrains Mono',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

export default function Dashboard({ portfolios, onNav }) {
  const stats = useMemo(() => {
    const valid = Array.isArray(portfolios) ? portfolios : [];
    if (!valid.length) return null;

    const totalAUM = valid.reduce((s, p) => s + (p?.portfolioValue ?? 0), 0);
    const holdingCount = valid.reduce((s, p) => s + (p?.holdings?.length ?? 0), 0);

    const validVols = valid.filter((p) => p?.totalVolatility != null);
    const avgVol = validVols.length > 0
      ? validVols.reduce((s, p) => s + p.totalVolatility, 0) / validVols.length
      : 0;

    const alloc = valid
      .filter((p) => (p?.portfolioValue ?? 0) > 0)
      .map((p) => ({ name: p?.name ?? 'Unknown', value: p.portfolioValue }));

    const holdingsMap = {};
    valid.forEach((p) => {
      (p?.holdings ?? []).forEach((h) => {
        if (!h?.ticker) return;
        holdingsMap[h.ticker] = (holdingsMap[h.ticker] ?? 0) +
          (h.currentValue ?? ((h.quantity ?? 0) * (h.currentPrice ?? 0)));
      });
    });

    const topHoldings = Object.entries(holdingsMap)
      .map(([ticker, value]) => ({ ticker, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const riskReturn = valid
      .filter((p) => p?.totalVolatility != null && p?.expectedReturn != null)
      .map((p) => ({
        name: p?.name ?? 'Unknown',
        x: +(p.totalVolatility * 100).toFixed(2),
        y: +(p.expectedReturn * 100).toFixed(2),
      }));

    return { totalAUM, holdingCount, avgVol, alloc, topHoldings, riskReturn };
  }, [portfolios]);

  if (!Array.isArray(portfolios) || !portfolios.length) {
    return (
      <div className="page">
        <h1 className="page-title">Dashboard</h1>
        <EmptyState
          icon="⬡"
          title="No portfolios yet"
          sub="Create your first portfolio to start tracking risk."
          action={
            <button id="btn-create-first" className="btn btn-primary" onClick={() => onNav('portfolios')}>
              Create Portfolio
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page page-fade-in">
      <div className="flex items-center justify-between mb-16">
        <h1 className="page-title">Dashboard</h1>
        <button id="btn-run-analysis" className="btn btn-secondary btn-sm" onClick={() => onNav('analytics')}>
          ◈ Run Analysis
        </button>
      </div>

      <div className="grid-4 section">
        <StatCard label="Total AUM" value={fmt.usd(stats?.totalAUM)} accent="var(--emerald)" />
        <StatCard label="Portfolios" value={portfolios.length} />
        <StatCard label="Holdings" value={stats?.holdingCount} />
        <StatCard
          label="Avg Volatility"
          value={fmt.pct(stats?.avgVol)}
          accent={(stats?.avgVol ?? 0) > 0.2 ? 'var(--crimson)' : (stats?.avgVol ?? 0) > 0.1 ? 'var(--gold)' : 'var(--emerald)'}
        />
      </div>

      <div className="grid-2 section">
        <div className="card">
          <div className="card-title">Portfolio Allocation</div>
          {stats?.alloc?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.alloc} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} innerRadius={40} paddingAngle={3}
                  label={({ name, percent }) => `${String(name).slice(0, 10)} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {stats.alloc.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TIP_STYLE} formatter={(v) => fmt.usd(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="○" title="No value data" sub="Refresh prices to populate." />
          )}
        </div>

        <div className="card">
          <div className="card-title">Top Holdings by Exposure</div>
          {stats?.topHoldings?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.topHoldings} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2640" vertical={false} />
                <XAxis dataKey="ticker" tick={{ fill: '#7A8499', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#7A8499', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TIP_STYLE} formatter={(v) => fmt.usd(v)} />
                <Bar dataKey="value" fill="#00D4AA" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="○" title="No holdings data" />
          )}
        </div>
      </div>

      {stats?.riskReturn?.length > 0 && (
        <div className="card section">
          <div className="card-title">Risk vs Return Comparison</div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 0, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2640" />
              <XAxis dataKey="x" name="Volatility (%)" unit="%" tick={{ fill: '#7A8499', fontSize: 11 }} />
              <YAxis dataKey="y" name="Return (%)" unit="%" tick={{ fill: '#7A8499', fontSize: 11 }} />
              <Tooltip
                contentStyle={TIP_STYLE}
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ ...TIP_STYLE, padding: '8px 12px' }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                      <div>Vol: {d.x}%</div>
                      <div>Return: {d.y}%</div>
                    </div>
                  );
                }}
              />
              <Scatter data={stats.riskReturn} fill="#4B9EFF" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card-title" style={{ marginBottom: 12 }}>Your Portfolios</div>
      <div className="grid-3">
        {portfolios.map((p) => (
          <div key={p?.id ?? Math.random()} className="card card-hover" style={{ cursor: 'pointer' }}
            onClick={() => onNav('portfolios')}>
            <div className="flex items-center justify-between mb-8">
              <span style={{ fontWeight: 700, fontSize: 14 }}>{p?.name ?? 'Unknown'}</span>
              <span className={`badge badge-${(p?.totalVolatility ?? 0) > 0.2 ? 'red' : (p?.totalVolatility ?? 0) > 0.1 ? 'yellow' : 'green'}`}>
                {p?.totalVolatility != null ? fmt.pct(p.totalVolatility) + ' vol' : 'N/A'}
              </span>
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--emerald)' }}>
              {fmt.usd(p?.portfolioValue ?? 0)}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {p?.holdings?.length ?? 0} holdings · {p?.currency ?? 'USD'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
