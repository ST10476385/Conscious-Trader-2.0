# Khanyisa Trading Backend API

Production-ready Express.js backend with PostgreSQL database for the Khanyisa trading platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure database**
Edit `.env` with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=khanyisa
DB_USER=postgres
DB_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/khanyisa
```

3. **Create database**
```bash
# Create database in PostgreSQL
createdb khanyisa
```

4. **Initialize schema**
```bash
npm run setup-db
```

5. **Start server**
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

---

## 📚 API Endpoints

### Authentication

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "password123",
  "fullName": "John Trader"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "password123"
}
```

Response includes `token` - use in Authorization header:
```
Authorization: Bearer <token>
```

---

### Trades Management

**Create trade (pending approval)**
```http
POST /api/trades
Authorization: Bearer <token>
Content-Type: application/json

{
  "pair": "EUR/USD",
  "signalType": "BUY",
  "entryPrice": 1.0850,
  "stopLoss": 1.0800,
  "takeProfitPrice": 1.0900,
  "positionSize": 100000,
  "confidence": 75.5,
  "reason": "RSI oversold + EMA cross",
  "notes": "Strong signal"
}
```

**Get all trades**
```http
GET /api/trades
Authorization: Bearer <token>
```

**Get open trades**
```http
GET /api/trades/status/open
Authorization: Bearer <token>
```

**Get closed trades**
```http
GET /api/trades/status/closed
Authorization: Bearer <token>
```

**Approve trade**
```http
PUT /api/trades/{tradeId}/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Approved - signal looks good"
}
```

**Reject trade**
```http
PUT /api/trades/{tradeId}/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Risk too high"
}
```

**Execute trade**
```http
PUT /api/trades/{tradeId}/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Executing now"
}
```

**Close trade (with exit price)**
```http
PUT /api/trades/{tradeId}/close
Authorization: Bearer <token>
Content-Type: application/json

{
  "exitPrice": 1.0875
}
```

Returns P&L calculation:
```json
{
  "exitPrice": 1.0875,
  "profitLoss": 2500,
  "profitLossPercentage": 0.23
}
```

---

### Performance & Analytics

**Get account balance**
```http
GET /api/performance/balance
Authorization: Bearer <token>
```

**Get daily P&L**
```http
GET /api/performance/daily-pnl
Authorization: Bearer <token>
```

**Get statistics**
```http
GET /api/performance/stats
Authorization: Bearer <token>
```

Returns:
```json
{
  "totalTrades": 25,
  "winningTrades": 18,
  "losingTrades": 7,
  "winRate": 72,
  "totalProfitLoss": 5420.50,
  "totalReturnPercentage": 10.84,
  "bestTrade": 850,
  "worstTrade": -320
}
```

**Get open positions**
```http
GET /api/performance/positions
Authorization: Bearer <token>
```

**Get risk metrics**
```http
GET /api/performance/risk-metrics
Authorization: Bearer <token>
```

Returns:
```json
{
  "dailyLossLimit": 1000,
  "dailyPnL": -450,
  "dailyLimitExceeded": false,
  "totalExposure": 500000,
  "exposurePercentage": 100,
  "exposureHealthy": true
}
```

**Update risk settings**
```http
PUT /api/performance/risk-settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "dailyLossLimit": 1500,
  "maxPositionSize": 15,
  "maxRiskPerTrade": 2.5
}
```

---

## 🗄️ Database Schema

### Users
```sql
- id (UUID, primary key)
- email (unique)
- password_hash
- full_name
- account_balance
- daily_loss_limit
- max_position_size
- max_risk_per_trade
- status
- created_at
- updated_at
```

### Trades
```sql
- id (UUID, primary key)
- user_id (foreign key)
- pair
- signal_type (BUY/SELL)
- entry_price
- stop_loss
- take_profit
- position_size
- status (pending_approval, approved, executed, closed, rejected)
- confidence
- reason
- notes
- created_at
- updated_at
```

### Trade Executions
```sql
- id (UUID, primary key)
- trade_id (foreign key)
- executed_at
- exit_price
- profit_loss
- profit_loss_percentage
- status
```

### Other Tables
- `risk_metrics` - Risk calculations per user
- `performance_stats` - Statistics and metrics
- `trading_signals` - Signal history

---

## 🔐 Security Notes

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Store sensitive data in environment variables
- Implement rate limiting for production
- Add CORS whitelist for specific domains
- Validate all inputs on backend

---

## 📊 Testing with Postman

1. Create Postman collection
2. Set environment variable: `token` from login response
3. Use `{{token}}` in Authorization header
4. Test endpoints in order:
   - Register/Login
   - Create trade
   - Approve trade
   - Execute trade
   - Get stats

---

## 🐛 Troubleshooting

**"DATABASE_URL not set"**
- Check `.env` file exists in backend folder
- Verify `DATABASE_URL` is set

**"Database connection failed"**
- Ensure PostgreSQL is running
- Check credentials in `.env`
- Create database: `createdb khanyisa`

**"Port 5000 already in use"**
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:5000 | xargs kill -9`

**"Invalid token"**
- Check token hasn't expired
- Re-login to get new token
- Verify token format in Authorization header

---

## 📝 Next Steps

1. **Connect Frontend** - Update frontend API calls to use backend endpoints
2. **Add Webhooks** - Real-time price alerts and monitoring
3. **Broker Integration** - Connect to MT5/Alpaca for real execution
4. **WebSocket** - Real-time trade monitoring
5. **Notifications** - Email/SMS alerts
6. **Deployment** - Deploy to Railway/Heroku/AWS

---

## 📞 Support

For issues or questions, check:
- `.env` configuration
- PostgreSQL connection
- API endpoint format
- Request/response logs in console

Happy trading! 🚀
