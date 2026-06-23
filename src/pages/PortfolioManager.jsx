import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import client from '../api/client.js';
import { fmt } from '../utils/fmt.js';

const COLORS = ['#00D4AA', '#4B9EFF', '#F5A623', '#FF4B6E', '#9B6BFF', '#00C49F'];
const TIP_STYLE = { background: '#141928', border: '1px solid #1E2640', borderRadius: 10, fontSize: 12, fontFamily: 'JetBrains Mono' };

/* ── Create Portfolio Modal ──────────────────────────────────────────── */
function CreatePortfolioModal({ onClose, onCreated, toast }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return toast?.('Portfolio name is required.', 'error');
    setLoading(true);
    try {
      const p = await client.createPortfolio(name.trim(), desc.trim(), currency);
      toast?.('Portfolio created!', 'success');
      onCreated(p);
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="New Portfolio" onClose={onClose}
      actions={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button id="btn-create-portfolio" className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create'}
          </button>
        </>
      }>
      <div className="form-group">
        <label className="label" htmlFor="portfolio-name">Name</label>
        <input id="portfolio-name" className="input" placeholder="My Portfolio" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="portfolio-desc">Description</label>
        <input id="portfolio-desc" className="input" placeholder="Optional…" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="label" htmlFor="portfolio-currency">Currency</label>
        <select id="portfolio-currency" className="input" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ cursor: 'pointer' }}>
          {['USD', 'EUR', 'GBP', 'JPY', 'INR'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
    </Modal>
  );
}

/* ── Add Holding Modal ───────────────────────────────────────────────── */
function AddHoldingModal({ portfolioId, onClose, onAdded, toast }) {
  const [ticker, setTicker] = useState('');
  const [market, setMarket] = useState('US');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!ticker || !qty || !price) return toast?.('Ticker, quantity, and price are required.', 'error');
    setLoading(true);
    try {
      await client.addHolding(portfolioId, ticker.toUpperCase().trim(), market, +qty, +price, notes);
      toast?.('Holding added!', 'success');
      onAdded();
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Add Holding" onClose={onClose}
      actions={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button id="btn-add-holding" className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Add'}
          </button>
        </>
      }>
      <div className="input-row">
        <div className="form-group flex-1">
          <label className="label" htmlFor="holding-ticker">Ticker</label>
          <input id="holding-ticker" className="input" placeholder="AAPL" value={ticker} onChange={(e) => setTicker(e.target.value)} />
        </div>
        <div className="form-group" style={{ minWidth: 110 }}>
          <label className="label" htmlFor="holding-market">Market</label>
          <select id="holding-market" className="input" value={market} onChange={(e) => setMarket(e.target.value)} style={{ cursor: 'pointer' }}>
            {['US', 'INDIA', 'GLOBAL'].map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="input-row">
        <div className="form-group flex-1">
          <label className="label" htmlFor="holding-qty">Quantity</label>
          <input id="holding-qty" className="input" type="number" min="0" placeholder="100" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="form-group flex-1">
          <label className="label" htmlFor="holding-price">Purchase Price</label>
          <input id="holding-price" className="input" type="number" min="0" step="0.01" placeholder="150.00" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="label" htmlFor="holding-notes">Notes</label>
        <input id="holding-notes" className="input" placeholder="Optional…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}

/* ── Holdings Table ──────────────────────────────────────────────────── */
function HoldingsTable({ holdings, portfolioId, onDeleted, toast }) {
  async function del(hId) {
    try {
      await client.deleteHolding(portfolioId, hId);
      toast?.('Holding removed.', 'info');
      onDeleted();
    } catch (e) {
      toast?.(e.message, 'error');
    }
  }

  if (!Array.isArray(holdings) || !holdings.length) {
    return <EmptyState icon="○" title="No holdings" sub="Add a holding to get started." />;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Ticker</th><th>Market</th><th>Qty</th>
            <th>Buy Price</th><th>Current</th><th>Value</th><th>P&L</th><th></th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            if (!h) return null;
            const quantity = h.quantity ?? 0;
            const purchasePrice = h.purchasePrice ?? 0;
            const currentPrice = h.currentPrice ?? 0;
            const pl = h.gainLoss ?? ((currentPrice - purchasePrice) * quantity);
            const plPct = h.gainLossPercent ?? (purchasePrice > 0 ? (currentPrice - purchasePrice) / purchasePrice : 0);

            return (
              <tr key={h.id ?? Math.random()}>
                <td style={{ fontWeight: 700, color: 'var(--text)' }}>{h.ticker ?? 'Unknown'}</td>
                <td style={{ color: 'var(--text-muted)' }}>{h.market ?? '—'}</td>
                <td>{fmt.num(quantity, 4)}</td>
                <td>{fmt.usd(purchasePrice)}</td>
                <td>{fmt.usd(currentPrice)}</td>
                <td>{fmt.usd(h.currentValue ?? (currentPrice * quantity))}</td>
                <td>
                  <span className={fmt.sign(pl)}>
                    {fmt.usd(pl)} <span style={{ fontSize: 10 }}>({fmt.pct(plPct)})</span>
                  </span>
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => del(h.id)}>✕</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Portfolio Detail ────────────────────────────────────────────────── */
function PortfolioDetail({ portfolio, onRefresh, onDelete, toast }) {
  const [holdings, setHoldings] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadHoldings = useCallback(async () => {
    if (!portfolio?.id) return;
    try {
      const data = await client.getHoldings(portfolio.id);
      setHoldings(Array.isArray(data) ? data : []);
    } catch (e) {
      toast?.(e.message, 'error');
      setHoldings([]);
    }
  }, [portfolio?.id]);

  useEffect(() => { loadHoldings(); }, [loadHoldings]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await client.refreshPortfolio(portfolio.id);
      await loadHoldings();
      onRefresh();
      toast?.('Prices refreshed!', 'success');
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${portfolio?.name ?? 'portfolio'}"? This cannot be undone.`)) return;
    try {
      await client.deletePortfolio(portfolio.id);
      toast?.('Portfolio deleted.', 'info');
      onDelete();
    } catch (e) {
      toast?.(e.message, 'error');
    }
  }

  const validHoldings = Array.isArray(holdings) ? holdings : [];
  const pieData = validHoldings
    .filter((h) => h != null && (h.currentValue ?? 0) > 0)
    .map((h) => ({ name: h.ticker ?? 'Unknown', value: h.currentValue ?? ((h.quantity ?? 0) * (h.currentPrice ?? 0)) }));

  const gainLossData = validHoldings
    .filter((h) => h?.gainLoss != null)
    .map((h) => ({ ticker: h.ticker ?? 'Unknown', pl: +(h.gainLoss).toFixed(2) }));

  const totalCost = validHoldings.reduce((sum, h) => sum + ((h?.quantity ?? 0) * (h?.purchasePrice ?? 0)), 0);
  const unrealizedGainLoss = validHoldings.reduce((sum, h) => sum + (h?.gainLoss ?? 0), 0);
  const totalReturn = totalCost > 0 ? unrealizedGainLoss / totalCost : 0;

  return (
    <div className="page-fade-in">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{portfolio?.name ?? 'Portfolio'}</h2>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {portfolio?.currency ?? 'USD'} · {validHoldings.length} holdings
          </span>
        </div>
        <div className="flex gap-8">
          <button id="btn-refresh-prices" className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <span className="spinner" /> : '↻ Refresh'}
          </button>
          <button id="btn-add-holding-open" className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add</button>
          <button id="btn-delete-portfolio" className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="grid-4 section">
        <div className="card">
          <div className="card-title">Total Value</div>
          <div className="card-value mono" style={{ color: 'var(--emerald)', fontSize: 22 }}>
            {fmt.usd(portfolio?.portfolioValue ?? 0)}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Total Cost</div>
          <div className="card-value mono" style={{ fontSize: 22 }}>{fmt.usd(totalCost)}</div>
        </div>
        <div className="card">
          <div className="card-title">Unrealised P&L</div>
          <div className={`card-value mono ${fmt.sign(unrealizedGainLoss)}`} style={{ fontSize: 22 }}>
            {fmt.usd(unrealizedGainLoss)}
          </div>
          <div className={`card-sub ${fmt.sign(totalReturn)}`}>{fmt.pct(totalReturn)}</div>
        </div>
        <div className="card">
          <div className="card-title">Volatility</div>
          <div className="card-value mono" style={{
            fontSize: 22,
            color: (portfolio?.totalVolatility ?? 0) > 0.2 ? 'var(--crimson)' : (portfolio?.totalVolatility ?? 0) > 0.1 ? 'var(--gold)' : 'var(--emerald)',
          }}>
            {fmt.pct(portfolio?.totalVolatility ?? 0)}
          </div>
        </div>
      </div>

      {(pieData.length > 0 || gainLossData.length > 0) && (
        <div className="grid-2 section">
          {pieData.length > 0 && (
            <div className="card">
              <div className="card-title">Allocation</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={70} innerRadius={30} paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TIP_STYLE} formatter={(v) => fmt.usd(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {gainLossData.length > 0 && (
            <div className="card">
              <div className="card-title">Gain / Loss by Holding</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={gainLossData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2640" vertical={false} />
                  <XAxis dataKey="ticker" tick={{ fill: '#7A8499', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#7A8499', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={TIP_STYLE} formatter={(v) => fmt.usd(v)} />
                  <Bar dataKey="pl" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {gainLossData.map((entry, i) => (
                      <Cell key={i} fill={entry.pl >= 0 ? '#00D4AA' : '#FF4B6E'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-title">Holdings</div>
        <HoldingsTable holdings={validHoldings} portfolioId={portfolio?.id}
          onDeleted={loadHoldings} toast={toast} />
      </div>

      {showAdd && (
        <AddHoldingModal
          portfolioId={portfolio?.id}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); loadHoldings(); onRefresh(); }}
          toast={toast}
        />
      )}
    </div>
  );
}

/* ── Portfolio Manager (Main Export) ─────────────────────────────────── */
export default function PortfolioManager({ portfolios = [], onRefresh, toast }) {
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (selected) {
      const updated = (Array.isArray(portfolios) ? portfolios : []).find((p) => p?.id === selected.id);
      if (updated) setSelected(updated);
      else setSelected(null);
    }
  }, [portfolios, selected]);

  return (
    <div className="page" style={{ display: 'flex', gap: 0, padding: 0, height: '100%' }}>
      {/* Portfolio List Sidebar */}
      <div className="portfolio-list-panel">
        <div className="flex items-center justify-between" style={{ padding: '20px 16px 12px' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Portfolios</span>
          <button id="btn-new-portfolio" className="btn btn-primary btn-sm btn-icon" onClick={() => setShowCreate(true)}>+</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {(!Array.isArray(portfolios) || portfolios.length === 0) && (
            <div style={{ padding: '20px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
              No portfolios yet.
            </div>
          )}
          {(Array.isArray(portfolios) ? portfolios : []).map((p) => {
            if (!p) return null;
            const isActive = selected?.id === p.id;
            return (
              <button key={p.id ?? Math.random()}
                onClick={() => setSelected(p)}
                className={`portfolio-list-item ${isActive ? 'active' : ''}`}>
                <div style={{ fontWeight: 600, fontSize: 13, color: isActive ? 'var(--emerald)' : 'var(--text)' }}>
                  {p.name ?? 'Unknown'}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {fmt.usd(p.portfolioValue ?? 0)} · {p.holdings?.length ?? 0} holdings
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {selected ? (
          <PortfolioDetail
            key={selected.id}
            portfolio={selected}
            onRefresh={onRefresh}
            onDelete={() => { setSelected(null); onRefresh(); }}
            toast={toast}
          />
        ) : (
          <EmptyState icon="◧" title="Select a portfolio"
            sub="Choose from the list or create a new one."
            action={
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                + New Portfolio
              </button>
            }
          />
        )}
      </div>

      {showCreate && (
        <CreatePortfolioModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => { setShowCreate(false); onRefresh(); setSelected(p); }}
          toast={toast}
        />
      )}
    </div>
  );
}
