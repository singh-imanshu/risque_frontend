const client = {
  token: null,

  setToken(token) {
    this.token = token;
  },

  clearToken() {
    this.token = null;
  },

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(path, { ...options, headers });
    const text = await res.text();

    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new Error(`Invalid server response (HTTP ${res.status})`);
    }

    if (!res.ok || json.success === false) {
      throw new Error(json.message || `HTTP ${res.status}`);
    }

    return json.data ?? json;
  },

  // ── Auth ──────────────────────────────────────────────
  async login(email, password) {
    const data = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  },

  async register(email, password) {
    return await this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // No token set here — registration now requires OTP verification
  },

  async verifyOtp(email, otp) {
    const data = await this.request('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    this.setToken(data.token);
    return data;
  },

  async resendOtp(email) {
    return await this.request('/api/v1/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // ── Portfolios ────────────────────────────────────────
  getPortfolios() {
    return this.request('/api/v1/portfolios');
  },

  createPortfolio(name, description = '', currency = 'USD') {
    return this.request('/api/v1/portfolios', {
      method: 'POST',
      body: JSON.stringify({ name, description, currency }),
    });
  },

  updatePortfolio(id, fields) {
    return this.request(`/api/v1/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    });
  },

  deletePortfolio(id) {
    return this.request(`/api/v1/portfolios/${id}`, { method: 'DELETE' });
  },

  // ── Holdings ──────────────────────────────────────────
  getHoldings(portfolioId) {
    return this.request(`/api/v1/holdings/${portfolioId}`);
  },

  addHolding(portfolioId, ticker, market, quantity, purchasePrice, notes = '') {
    return this.request(`/api/v1/holdings/${portfolioId}`, {
      method: 'POST',
      body: JSON.stringify({ ticker, market, quantity, purchasePrice, notes }),
    });
  },

  updateHolding(portfolioId, holdingId, fields) {
    return this.request(`/api/v1/holdings/${portfolioId}/${holdingId}`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    });
  },

  deleteHolding(portfolioId, holdingId) {
    return this.request(`/api/v1/holdings/${portfolioId}/${holdingId}`, { method: 'DELETE' });
  },

  refreshPortfolio(portfolioId) {
    return this.request(`/api/v1/holdings/${portfolioId}/refresh-prices`, { method: 'POST' });
  },

  // ── Analytics ─────────────────────────────────────────
  analyzePortfolio(tickers, weights, analysisType = 'STANDARD', portfolioId = null) {
    return this.request('/api/v1/analytics/analyze', {
      method: 'POST',
      body: JSON.stringify({ tickers, weights, analysisType, portfolioId }),
    });
  },

  quickAnalysis(tickers, weights) {
    return this.request('/api/v1/analytics/quick-analysis', {
      method: 'POST',
      body: JSON.stringify({ tickers, weights, analysisType: 'QUICK' }),
    });
  },
};

export default client;
