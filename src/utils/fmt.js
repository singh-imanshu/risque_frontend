export const fmt = {
  pct: (v, dec = 2) => {
    if (v == null || isNaN(Number(v))) return '—';
    return `${(Number(v) * 100).toFixed(dec)}%`;
  },

  num: (v, dec = 2) => {
    if (v == null || isNaN(Number(v))) return '—';
    return Number(v).toFixed(dec);
  },

  usd: (v) => {
    if (v == null || isNaN(Number(v))) return '—';
    return `$${Number(v).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },

  sign: (v) => {
    if (v == null || isNaN(Number(v))) return 'neutral';
    return Number(v) > 0 ? 'pos' : Number(v) < 0 ? 'neg' : 'neutral';
  },

  short: (s, n = 14) => {
    if (!s) return '';
    const str = String(s);
    return str.length > n ? str.slice(0, n) + '…' : str;
  },

  date: (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch { return '—'; }
  },
};

export function riskLevel(volatility) {
  if (volatility == null || isNaN(Number(volatility))) return { label: '—', color: 'var(--text-muted)' };
  const v = Number(volatility) * 100;
  if (v < 10)  return { label: 'LOW',       color: 'var(--emerald)' };
  if (v < 20)  return { label: 'MODERATE',  color: 'var(--gold)'    };
  if (v < 30)  return { label: 'HIGH',      color: 'var(--gold)'    };
  return            { label: 'VERY HIGH',  color: 'var(--crimson)' };
}
