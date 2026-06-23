import React, { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import client from '../api/client.js';
import { fmt, riskLevel } from '../utils/fmt.js';

const TIP_STYLE = { background: '#141928', border: '1px solid #1E2640', borderRadius: 10, fontSize: 12, fontFamily: 'JetBrains Mono' };

const ANALYSIS_TYPES = [
  { id: 'QUICK',         label: 'Quick',         desc: 'Volatility & returns only' },
  { id: 'STANDARD',      label: 'Standard',      desc: '+ Sharpe, Beta, Correlation' },
  { id: 'COMPREHENSIVE', label: 'Comprehensive', desc: '+ AI insights & full profile' },
];

function MetricPill({ label, value, accent }) {
  return (
    <div className="metric-pill">
      <span className="metric-label">{label}</span>
      <span className="metric-value" style={accent ? { color: accent } : undefined}>{value}</span>
    </div>
  );
}

function CorrMatrix({ matrix, tickers }) {
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(tickers)) return null;
  function bg(v) {
    if (v >= 0.7) return 'rgba(255,75,110,0.4)';
    if (v >= 0.4) return 'rgba(245,166,35,0.3)';
    if (v >= 0.1) return 'rgba(0,212,170,0.2)';
    if (v < 0)    return 'rgba(75,158,255,0.2)';
    return 'rgba(30,38,64,0.5)';
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
        <thead>
          <tr>
            <th style={{ width: 40 }} />
            {tickers.map((t) => (
              <th key={t} style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', padding: '0 4px', textAlign: 'center' }}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', paddingRight: 8 }}>{tickers[i] ?? '—'}</td>
              {(Array.isArray(row) ? row : []).map((val, j) => (
                <td key={j}>
                  <div className="corr-cell" style={{ background: bg(val ?? 0), color: (val ?? 0) > 0.5 ? 'var(--text)' : 'var(--text-muted)' }}>
                    {(val ?? 0).toFixed(2)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsPage({ portfolios = [], toast }) {
  const [tickers, setTickers]     = useState('');
  const [weights, setWeights]     = useState('');
  const [analysisType, setType]   = useState('STANDARD');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);

  function populateFromPortfolio(p) {
    if (!p) return;
    const holdings = Array.isArray(p.holdings) ? p.holdings : [];
    if (!holdings.length) return toast?.('This portfolio has no holdings.', 'error');
    
    const validHoldings = holdings.filter(h => h && h.ticker);
    setTickers(validHoldings.map((h) => h.ticker).join(', '));
    
    const totalValue = validHoldings.reduce((sum, h) => {
      const val = h.currentValue || (h.quantity * h.purchasePrice) || 0;
      return sum + val;
    }, 0);

    if (totalValue > 0) {
      const calcWeights = validHoldings.map(h => {
        const val = h.currentValue || (h.quantity * h.purchasePrice) || 0;
        return (val / totalValue).toFixed(4);
      });
      setWeights(calcWeights.join(', '));
    } else {
      setWeights('');
    }
    
    setSelectedPortfolioId(p.id);
  }

  async function run() {
    const rawTickers = tickers.split(/[\s,]+/).filter(Boolean).map((t) => t.toUpperCase());
    if (!rawTickers.length) return toast?.('Enter at least one ticker.', 'error');

    const rawWeights = weights.split(/[\s,]+/).filter(Boolean).map(Number);
    if (rawWeights.length && rawWeights.length !== rawTickers.length)
      return toast?.('Number of weights must match number of tickers.', 'error');

    if (rawWeights.length) {
      const sum = rawWeights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.01)
        return toast?.(`Weights must sum to 1.0 (current sum: ${sum.toFixed(4)})`, 'error');
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await client.analyzePortfolio(rawTickers, rawWeights.length ? rawWeights : null, analysisType, selectedPortfolioId);
      if (!data?.riskMetrics) throw new Error('Invalid analytics response structure.');

      setResult({
        ...data.riskMetrics,
        aiInsight: data.aiInsight,
        tickers: rawTickers,
      });
      toast?.('Analysis complete!', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function radarData(r) {
    if (!r) return [];
    return [
      { axis: 'Volatility',  score: Math.min((r.volatility ?? 0) * 100 * 2, 100), actual: fmt.pct(r.volatility) },
      { axis: 'Sharpe',      score: Math.min(Math.max((r.sharpeRatio ?? 0) * 20, 0), 100), actual: fmt.num(r.sharpeRatio) },
      { axis: 'Stability',   score: Math.max(100 - (r.volatility ?? 0) * 100 * 2, 0), actual: fmt.pct(Math.max(1 - (r.volatility ?? 0) * 2, 0)) },
      { axis: 'Return',      score: Math.min(Math.max((r.expectedReturn ?? 0) * 100 + 50, 0), 100), actual: fmt.pct(r.expectedReturn) },
      { axis: 'Beta Risk',   score: Math.min((r.beta ?? 1) * 50, 100), actual: fmt.num(r.beta) },
    ];
  }

  const risk = result ? riskLevel(result?.volatility) : null;

  return (
    <div className="page page-fade-in">
      <h1 className="page-title">Risk Analytics</h1>

      <div className="card section">
        <div className="grid-2" style={{ gap: 20 }}>
          <div>
            <div className="form-group">
              <label className="label" htmlFor="analytics-tickers">
                Tickers <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(comma or space separated)</span>
              </label>
              <input id="analytics-tickers" className="input" placeholder="AAPL, MSFT, GOOGL" value={tickers} onChange={(e) => { setTickers(e.target.value); setSelectedPortfolioId(null); }} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="analytics-weights">
                Weights <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(optional, must sum to 1)</span>
              </label>
              <input id="analytics-weights" className="input" placeholder="0.4, 0.35, 0.25" value={weights} onChange={(e) => { setWeights(e.target.value); setSelectedPortfolioId(null); }} />
            </div>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 10 }}>Analysis Type</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ANALYSIS_TYPES.map((t) => (
                <button key={t.id}
                  onClick={() => setType(t.id)}
                  className={`analysis-type-btn ${analysisType === t.id ? 'active' : ''}`}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: analysisType === t.id ? 'var(--emerald)' : 'var(--text)' }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {Array.isArray(portfolios) && portfolios.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <label className="label" style={{ marginBottom: 8 }}>Auto-populate from portfolio</label>
            <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
              {portfolios.map((p) => {
                if (!p) return null;
                return (
                  <button key={p.id ?? Math.random()} className="btn btn-ghost btn-sm" onClick={() => populateFromPortfolio(p)}>
                    {p.name ?? 'Unknown'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button id="btn-run-analysis" className="btn btn-primary" onClick={run} disabled={loading}>
            {loading ? <><span className="spinner" /> Analysing…</> : '◈ Run Analysis'}
          </button>
        </div>
      </div>

      {result && (
        <>
          <div className="card-title" style={{ marginBottom: 12 }}>
            Results — {(result?.tickers ?? []).join(', ')}
            {risk && (
              <span style={{ marginLeft: 12, fontSize: 11, color: risk.color, fontFamily: 'JetBrains Mono' }}>
                [{risk.label} RISK]
              </span>
            )}
          </div>

          <div className="grid-3 section">
            <div className="card">
              <div className="card-title">Volatility &amp; Return</div>
              <MetricPill label="Annualised Vol"    value={fmt.pct(result?.volatility)} accent={risk?.color} />
              <MetricPill label="Annualised Return"  value={fmt.pct(result?.expectedReturn)} accent={(result?.expectedReturn ?? 0) >= 0 ? 'var(--emerald)' : 'var(--crimson)'} />
              <MetricPill label="Annualised Variance" value={fmt.num(result?.variance, 6)} />
            </div>
            <div className="card">
              <div className="card-title">Risk Ratios</div>
              <MetricPill label="Sharpe Ratio"  value={fmt.num(result?.sharpeRatio)} accent={(result?.sharpeRatio ?? 0) > 1 ? 'var(--emerald)' : undefined} />
              <MetricPill label="Sortino Ratio" value={fmt.num(result?.sortinoRatio)} />
              <MetricPill label="Beta"          value={fmt.num(result?.beta)} accent={(result?.beta ?? 0) > 1.2 ? 'var(--crimson)' : undefined} />
            </div>
            <div className="card">
              <div className="card-title">Downside Risk</div>
              <MetricPill label="VaR 95%"     value={fmt.pct(result?.valueAtRisk95)} accent="var(--crimson)" />
              <MetricPill label="CVaR 95%"    value={result?.conditionalVar95 != null ? fmt.pct(result.conditionalVar95) : '—'} />
              <MetricPill label="Max Drawdown" value={result?.maxDrawdown != null ? fmt.pct(result.maxDrawdown) : '—'} accent="var(--crimson)" />
            </div>
          </div>

          <div className="grid-2 section">
            <div className="card">
              <div className="card-title">Risk Profile</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData(result)}>
                  <PolarGrid stroke="#1E2640" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#7A8499', fontSize: 11 }} />
                  <Radar dataKey="score" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.15} />
                  <Tooltip contentStyle={TIP_STYLE} formatter={(value, name, props) => [props.payload.actual, props.payload.axis]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {result?.assetVolatilities && (
              <div className="card">
                <div className="card-title">Asset Volatility</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={Object.entries(result.assetVolatilities).map(([ticker, vol]) => ({ ticker, vol: +(vol * 100).toFixed(2) }))}
                    margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2640" vertical={false} />
                    <XAxis dataKey="ticker" tick={{ fill: '#7A8499', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#7A8499', fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={TIP_STYLE} formatter={(v) => `${v}%`} />
                    <Bar dataKey="vol" radius={[6, 6, 0, 0]}>
                      {Object.values(result.assetVolatilities).map((vol, i) => (
                        <Cell key={i} fill={vol > 0.3 ? '#FF4B6E' : vol > 0.2 ? '#F5A623' : '#00D4AA'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {result?.correlationMatrix && (
            <div className="card section">
              <div className="card-title">Correlation Matrix</div>
              <CorrMatrix matrix={result.correlationMatrix} tickers={result.tickers} />
            </div>
          )}

          {result?.aiInsight && (
            <div className="insight-box section">
              <div className="insight-label">◈ AI Analyst Insight</div>
              <p className="insight-text">{result.aiInsight}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
