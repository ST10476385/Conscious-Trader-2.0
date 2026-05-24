/**
 * Backend API Client
 * Handles all communication with the Express backend
 * Manages authentication tokens and request headers
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Make authenticated API request
 */
const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Authentication methods
 */
export const authAPI = {
  /**
   * Register new user
   */
  register: async (email, password, fullName) => {
    const response = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  /**
   * Login user
   */
  login: async (email, password) => {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('authToken');
  },

  /**
   * Get authentication status
   */
  getAuthToken: () => localStorage.getItem('authToken'),
  
  isAuthenticated: () => !!localStorage.getItem('authToken'),
};

/**
 * Trade management methods
 */
export const tradesAPI = {
  /**
   * Get all trades for user
   */
  getAllTrades: () => request('/api/trades'),

  /**
   * Get single trade by ID
   */
  getTrade: (tradeId) => request(`/api/trades/${tradeId}`),

  /**
   * Get open trades
   */
  getOpenTrades: () => request('/api/trades/status/open'),

  /**
   * Get closed trades
   */
  getClosedTrades: () => request('/api/trades/status/closed'),

  /**
   * Create new trade (pending approval)
   */
  createTrade: (tradeData) => {
    const {
      pair,
      signalType,
      entryPrice,
      stopLoss,
      takeProfitPrice,
      positionSize,
      confidence,
      reason,
      notes,
    } = tradeData;

    return request('/api/trades', {
      method: 'POST',
      body: JSON.stringify({
        pair,
        signalType,
        entryPrice,
        stopLoss,
        takeProfitPrice,
        positionSize,
        confidence,
        reason,
        notes,
      }),
    });
  },

  /**
   * Approve trade
   */
  approveTrade: (tradeId, notes = '') =>
    request(`/api/trades/${tradeId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),

  /**
   * Reject trade
   */
  rejectTrade: (tradeId, reason = '') =>
    request(`/api/trades/${tradeId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  /**
   * Execute approved trade
   */
  executeTrade: (tradeId, notes = '') =>
    request(`/api/trades/${tradeId}/execute`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),

  /**
   * Close trade with exit price
   */
  closeTrade: (tradeId, exitPrice) =>
    request(`/api/trades/${tradeId}/close`, {
      method: 'PUT',
      body: JSON.stringify({ exitPrice }),
    }),

  /**
   * Send trade to MT5 bridge for execution
   */
  sendToMT5: (signal) =>
    request('/trade', {
      method: 'POST',
      body: JSON.stringify({
        action: signal.signal,
        symbol: signal.pair.replace('/', ''),
        lot: Number(signal.position_size || 0.01),
        stopLoss: Number(signal.stop_loss),
        takeProfit: Number(signal.take_profit),
      }),
    }),
};

/**
 * Performance and analytics methods
 */
export const performanceAPI = {
  /**
   * Get account balance
   */
  getBalance: () => request('/api/performance/balance'),

  /**
   * Get daily P&L
   */
  getDailyPnL: () => request('/api/performance/daily-pnl'),

  /**
   * Get performance statistics
   */
  getStats: () => request('/api/performance/stats'),

  /**
   * Get open positions
   */
  getPositions: () => request('/api/performance/positions'),

  /**
   * Get risk metrics
   */
  getRiskMetrics: () => request('/api/performance/risk-metrics'),

  /**
   * Update risk settings
   */
  updateRiskSettings: (dailyLossLimit, maxPositionSize, maxRiskPerTrade) =>
    request('/api/performance/risk-settings', {
      method: 'PUT',
      body: JSON.stringify({
        dailyLossLimit,
        maxPositionSize,
        maxRiskPerTrade,
      }),
    }),
};

/**
 * Default export with all API methods
 */
export const mt5API = {
  getAccount: () => request('/api/mt5/account'),
};

export default {
  auth: authAPI,
  trades: tradesAPI,
  performance: performanceAPI,
  mt5: mt5API,
  request, // For custom requests if needed
};
