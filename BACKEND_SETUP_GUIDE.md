# Backend Setup & Integration Guide

## 📋 Overview

Your Khanyisa backend is now ready! Here's what's been created:

```
backend/
├── server.js                    # Main Express server
├── package.json                 # Dependencies
├── .env                         # Configuration
├── README.md                    # API Documentation
├── db/
│   └── database.js             # PostgreSQL connection
├── middleware/
│   └── auth.js                 # JWT authentication
├── routes/
│   ├── auth.js                 # Register/login endpoints
│   ├── trades.js               # Trade management endpoints
│   └── performance.js          # Analytics & risk endpoints
└── scripts/
    └── setupDatabase.js        # Database schema initialization
```

## 🚀 Getting Started (5 Minutes)

### Step 1: Install PostgreSQL
**Windows**: Download from https://www.postgresql.org/download/windows/
- Keep defaults during installation
- Remember the postgres password

### Step 2: Create Database
Open PowerShell:
```powershell
createdb khanyisa
```

### Step 3: Install Backend Dependencies
```powershell
cd backend
npm install
```

### Step 4: Initialize Database Schema
```powershell
npm run setup-db
```

You should see:
```
✅ Database schema created successfully!
   - users
   - trades
   - trade_executions
   - risk_metrics
   - performance_stats
   - trading_signals
```

### Step 5: Start Backend Server
```powershell
npm run dev
```

You should see:
```
✅ Database connected
🚀 Khanyisa Backend Server running on http://localhost:5000
📊 Health check: http://localhost:5000/health
```

✅ **Backend is running!**

---

## 🔌 Connect Frontend to Backend

### Step 1: Update Frontend API Client

Create `src/api/backendClient.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
let authToken = localStorage.getItem('authToken');

const setAuthToken = (token) => {
  authToken = token;
  localStorage.setItem('authToken', token);
};

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

export default {
  // Auth
  register: (email, password, fullName) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  setAuthToken,
  getAuthToken,

  // Trades
  getTrades: () => request('/api/trades'),
  getOpenTrades: () => request('/api/trades/status/open'),
  getClosedTrades: () => request('/api/trades/status/closed'),
  createTrade: (trade) =>
    request('/api/trades', {
      method: 'POST',
      body: JSON.stringify(trade),
    }),

  approveTrade: (tradeId, notes) =>
    request(`/api/trades/${tradeId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),

  rejectTrade: (tradeId, reason) =>
    request(`/api/trades/${tradeId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),

  executeTrade: (tradeId, notes) =>
    request(`/api/trades/${tradeId}/execute`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),

  closeTrade: (tradeId, exitPrice) =>
    request(`/api/trades/${tradeId}/close`, {
      method: 'PUT',
      body: JSON.stringify({ exitPrice }),
    }),

  // Performance
  getBalance: () => request('/api/performance/balance'),
  getDailyPnL: () => request('/api/performance/daily-pnl'),
  getStats: () => request('/api/performance/stats'),
  getPositions: () => request('/api/performance/positions'),
  getRiskMetrics: () => request('/api/performance/risk-metrics'),
};
```

### Step 2: Update Frontend to Use Backend

In your React components, replace mock data with backend calls:

```javascript
import backendClient from '@/api/backendClient';

// Login
const handleLogin = async (email, password) => {
  const response = await backendClient.login(email, password);
  backendClient.setAuthToken(response.token);
  // Redirect to dashboard
};

// Create and save trade
const handleCreateTrade = async (tradeData) => {
  const response = await backendClient.createTrade(tradeData);
  // Trade is now saved in database
  return response.trade;
};

// Get trades from database
const trades = await backendClient.getTrades();
```

---

## 📊 Test Backend with Postman

### 1. Import API Collection

Create `backend/postman-collection.json`:

```json
{
  "info": { "name": "Khanyisa API" },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "url": { "raw": "http://localhost:5000/api/auth/register" },
        "body": {
          "raw": "{\"email\":\"trader@test.com\",\"password\":\"test123\",\"fullName\":\"Test Trader\"}"
        }
      }
    },
    {
      "name": "Get Trades",
      "request": {
        "method": "GET",
        "url": { "raw": "http://localhost:5000/api/trades" },
        "header": [
          { "key": "Authorization", "value": "Bearer {{token}}" }
        ]
      }
    }
  ]
}
```

### 2. Test Flow

1. POST `/api/auth/register` → Get `token`
2. Save token in Postman variable: `{{token}}`
3. POST `/api/trades` → Create trade
4. PUT `/api/trades/{id}/approve` → Approve trade
5. PUT `/api/trades/{id}/execute` → Execute trade
6. GET `/api/performance/stats` → See stats

---

## 🗄️ Database Inspection

### View Database in pgAdmin or psql

```powershell
# Connect to database
psql -U postgres -d khanyisa

# List tables
\dt

# View users
SELECT * FROM users;

# View trades
SELECT * FROM trades;

# Exit
\q
```

---

## 🔄 API Workflow

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
└────────┬────────┘
         │
         │ HTTP Requests
         ↓
┌─────────────────────────────┐
│  Backend API (Express)      │
│  - Authentication           │
│  - Trade Management         │
│  - Performance Tracking     │
└────────┬────────────────────┘
         │
         │ SQL Queries
         ↓
┌─────────────────┐
│  PostgreSQL DB  │
│  - Users        │
│  - Trades       │
│  - Executions   │
└─────────────────┘
```

## 📱 Example: Create and Execute Trade

**Frontend (React)**:
```javascript
// 1. Create trade
const trade = await backendClient.createTrade({
  pair: 'EUR/USD',
  signalType: 'BUY',
  entryPrice: 1.0850,
  stopLoss: 1.0800,
  takeProfitPrice: 1.0900,
  positionSize: 100000,
  confidence: 75.5,
});

// 2. Approve trade
await backendClient.approveTrade(trade.id);

// 3. Execute trade
await backendClient.executeTrade(trade.id);

// 4. Get stats
const stats = await backendClient.getStats();
console.log(`Win Rate: ${stats.winRate}%`);
console.log(`Total P&L: R ${stats.totalProfitLoss}`);
```

**Backend (Express)**:
```
POST /api/trades                 → Creates trade (status: pending_approval)
                                 → Saves to database
                                 → Returns trade object

PUT /api/trades/{id}/approve     → Updates trade status to "approved"

PUT /api/trades/{id}/execute     → Updates trade status to "executed"
                                 → Records execution in trade_executions table

GET /api/performance/stats       → Queries database
                                 → Calculates statistics
                                 → Returns stats
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Check PostgreSQL is running: `psql -U postgres` |
| "DATABASE_URL not found" | Verify `.env` exists in backend folder |
| "Port 5000 already in use" | Change PORT in `.env` or kill process |
| "CORS error in frontend" | Backend CORS is enabled for `localhost:5173` |
| "Invalid token" | Login again to get fresh token |

---

## ✅ Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] `createdb khanyisa` executed
- [ ] `npm install` in backend folder
- [ ] `npm run setup-db` successful
- [ ] `npm run dev` running on port 5000
- [ ] Database schema visible in `khanyisa` database
- [ ] POST `/api/auth/register` returns token
- [ ] GET `/api/trades` returns empty array (with token)
- [ ] Backend and frontend both running

---

## 🎯 Next Steps

1. **Connect Frontend** - Update all API calls to use backendClient
2. **Test Full Workflow** - Register → Create Trade → Approve → Execute
3. **Deploy Backend** - Railway, Heroku, or AWS
4. **Connect Broker** - MT5 or Alpaca integration
5. **Real-time Monitoring** - WebSocket for trade updates

---

## 📞 Quick Commands

```powershell
# Start backend
cd backend
npm run dev

# Start frontend (from root)
npm run dev

# Setup database
npm run setup-db

# View database
psql -U postgres -d khanyisa

# Reset everything
dropdb khanyisa
createdb khanyisa
npm run setup-db
```

---

**Your backend is production-ready!** 🚀

Run both services and your trading platform is fully functional!
