import React, { useState, useEffect } from 'react';
import client from './api/client.js';
import { useToast } from './hooks/useToast.js';
import { usePortfolios } from './hooks/usePortfolios.js';
import ToastContainer from './components/Toast.jsx';
import Sidebar from './components/Sidebar.jsx';
import AuthScreen from './pages/AuthScreen.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PortfolioManager from './pages/PortfolioManager.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');

  const { toasts, add: toast, remove } = useToast();
  const { portfolios, load: loadPortfolios } = usePortfolios();

  useEffect(() => {
    try {
      const savedToken = sessionStorage.getItem('risque_token');
      const savedUser = sessionStorage.getItem('risque_user');

      if (savedToken) {
        client.setToken(savedToken);
        setUser(savedUser ?? 'user');
        loadPortfolios().catch(console.error);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Storage Initialization Error:', err);
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, [loadPortfolios]);

  function handleAuth(data) {
    const email = data?.email ?? data?.user?.email ?? 'user';
    client.setToken(data.token);
    try {
      sessionStorage.setItem('risque_token', data.token);
      sessionStorage.setItem('risque_user', email);
    } catch (e) {
      console.warn('Session storage restricted', e);
    }
    setUser(email);
    loadPortfolios();
  }

  function handleLogout() {
    client.clearToken();
    try {
      sessionStorage.removeItem('risque_token');
      sessionStorage.removeItem('risque_user');
    } catch (e) {
      console.warn('Session storage restricted', e);
    }
    setUser(null);
    setPage('dashboard');
  }

  if (isInitializing) {
    return (
      <div className="auth-screen">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <span className="spinner" style={{ width: 36, height: 36, borderTopColor: 'var(--emerald)' }} />
          <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>Initializing environment…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen onAuth={handleAuth} toast={toast} />
        <ToastContainer toasts={toasts} onRemove={remove} />
      </>
    );
  }

  return (
    <div className="app">
      <Sidebar page={page} onNav={setPage} user={user} onLogout={handleLogout} />

      <div className="main">
        {page === 'dashboard' && (
          <Dashboard portfolios={portfolios} onNav={setPage} />
        )}
        {page === 'portfolios' && (
          <PortfolioManager portfolios={portfolios} onRefresh={loadPortfolios} toast={toast} />
        )}
        {page === 'analytics' && (
          <AnalyticsPage portfolios={portfolios} toast={toast} />
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
