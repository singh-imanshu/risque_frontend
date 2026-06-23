import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Fatal Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#0A0F1C', color: '#E8EDF5', minHeight: '100vh', fontFamily: 'JetBrains Mono, monospace' }}>
          <h1 style={{ color: '#FF4B6E', marginBottom: 20 }}>Application Crashed</h1>
          <p style={{ marginBottom: 20, fontSize: 14 }}>An unhandled exception occurred in the React component tree.</p>
          <div style={{ background: '#141928', padding: '20px', borderRadius: '12px', border: '1px solid #1E2640', overflowX: 'auto' }}>
            <h3 style={{ color: '#FF4B6E', margin: '0 0 10px 0', fontSize: 16 }}>{this.state.error?.toString()}</h3>
            <pre style={{ color: '#7A8499', fontSize: 12, margin: 0 }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24, padding: '12px 24px',
              background: 'linear-gradient(135deg, #00D4AA, #00B894)',
              color: '#0A0F1C', border: 'none', borderRadius: 10,
              cursor: 'pointer', fontWeight: 700, fontFamily: 'Syne, sans-serif',
              fontSize: 14, letterSpacing: '0.5px',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
