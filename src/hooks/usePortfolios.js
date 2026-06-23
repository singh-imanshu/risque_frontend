import { useState, useCallback } from 'react';
import client from '../api/client.js';

export function usePortfolios() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.getPortfolios();
      setPortfolios(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async (id) => {
    try {
      await client.refreshPortfolio(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }, [load]);

  return { portfolios, loading, error, load, refresh };
}
