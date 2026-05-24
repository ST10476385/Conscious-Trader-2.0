# Broker Integration Guide

Connect Khanyisa to real brokers for live trading with **Alpaca** or **MetaTrader 5 (MT5)**

## 🎯 Choose Your Broker

### Alpaca
- ✅ **Free tier available** (paper trading)
- ✅ Easy API integration
- ✅ Real-time data included
- ✅ Commission-free stocks & crypto
- Stock symbols: AAPL, MSFT, GOOGL, TSLA, etc.
- Crypto: BTC/USD, ETH/USD, etc.
- Website: https://alpaca.markets/

### MetaTrader 5 (MT5)
- ✅ Most popular trading platform
- ✅ Forex, stocks, CFDs, commodities
- ✅ Professional charting tools
- ⚠️ Requires broker account (FXCM, Pepperstone, etc.)
- More complex but powerful
- Website: https://www.metatrader5.com/

---

## 🚀 Alpaca Setup (Recommended for Beginners)

### 1. Create Alpaca Account

1. Go to https://alpaca.markets/
2. Sign up for free account
3. Verify email
4. Choose "Paper Trading" (no real money)

### 2. Get API Keys

1. Login to Alpaca dashboard
2. Go to "API Keys"
3. Generate new API key
4. Copy:
   - **API Key ID** (like `abc123...`)
   - **Secret Key** (like `xyz789...`)

⚠️ **NEVER share your secret key!**

### 3. Configure in Khanyisa

Create `.env.local` variables:
```env
VITE_BROKER_TYPE=alpaca
VITE_ALPACA_API_KEY=your_api_key_here
VITE_ALPACA_SECRET_KEY=your_secret_key_here
VITE_ALPACA_LIVE_TRADING=false  # Use paper trading first!
```

Or store in backend database with user account.

### 4. Create Broker Hook (Frontend)

```javascript
// src/hooks/useBroker.js
import { useState, useCallback } from 'react';
import UnifiedBrokerService from '@/services/brokers/unifiedBrokerService';

export const useBroker = () => {
  const [broker, setBroker] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    try {
      const brokerService = new UnifiedBrokerService('alpaca', {
        apiKey: import.meta.env.VITE_ALPACA_API_KEY,
        apiSecret: import.meta.env.VITE_ALPACA_SECRET_KEY,
        isLiveTrading: import.meta.env.VITE_ALPACA_LIVE_TRADING === 'true',
      });

      setBroker(brokerService);
      setIsConnected(true);
      return brokerService;
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      throw err;
    }
  }, []);

  const getBalance = useCallback(async () => {
    if (!broker) throw new Error('Not connected');
    return broker.getBalance();
  }, [broker]);

  const getPositions = useCallback(async () => {
    if (!broker) throw new Error('Not connected');
    return broker.getPositions();
  }, [broker]);

  const placeOrder = useCallback(
    async (orderData) => {
      if (!broker) throw new Error('Not connected');
      return broker.placeOrder(orderData);
    },
    [broker]
  );

  const closePosition = useCallback(
    async (positionId) => {
      if (!broker) throw new Error('Not connected');
      return broker.closePosition(positionId);
    },
    [broker]
  );

  return {
    broker,
    isConnected,
    error,
    connect,
    getBalance,
    getPositions,
    placeOrder,
    closePosition,
  };
};
```

### 5. Execute Trade from Frontend

```javascript
import { useBroker } from '@/hooks/useBroker';

function ExecuteTradeButton({ trade }) {
  const { broker, placeOrder } = useBroker();

  const handleExecute = async () => {
    try {
      const result = await placeOrder({
        pair: trade.pair,
        side: trade.signalType, // BUY or SELL
        volume: trade.positionSize,
        type: 'market',
        price: trade.entryPrice,
      });

      console.log('Order placed:', result);
      // Update backend with order info
      await backendClient.trades.executeTrade(trade.id);
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  return <button onClick={handleExecute}>Execute on Alpaca</button>;
}
```

### 6. Test with Paper Trading

1. Start your app
2. Connect to Alpaca (paper trading mode)
3. Place test order
4. Check Alpaca dashboard to confirm
5. Verify positions appear in your app

### 7. Switch to Live Trading (Optional)

```env
VITE_ALPACA_LIVE_TRADING=true  # Real money! Be careful!
```

⚠️ **Warning**: Live trading uses real money. Test thoroughly first!

---

## 🖥️ MetaTrader 5 Setup (Advanced)

### 1. Install MetaTrader 5

- Download from https://www.metatrader5.com/
- Install on your computer
- Open account with broker (FXCM, Pepperstone, etc.)
- Login with your credentials

### 2. Enable WebSocket Bridge

MT5 → Tools → Options → Expert Advisors → Allow WebSocket

Create MT5 script (Expert Advisor) to bridge:

```mql5
// MT5 Expert Advisor
#property strict

OnStart()
{
  // Listen on WebSocket
  // Implement WebSocket server in MT5
  // Receive commands: PLACE_ORDER, CLOSE_POSITION, etc.
  // Send responses back to client
}
```

Or use existing MT5 bridge tools:
- **MT5 Python API**: https://github.com/MetaTrader5
- **ZMQ Bridge**: Enable REST/gRPC to MT5
- **Docker MT5**: MT5 server in container

### 3. Configure in Khanyisa

```env
VITE_BROKER_TYPE=mt5
VITE_MT5_SERVER=localhost:8080
VITE_MT5_ACCOUNT=12345678
VITE_MT5_PASSWORD=your_password
VITE_MT5_BROKER_SERVER=your_broker_server
```

### 4. Connect to MT5

```javascript
const { connect } = useBroker();

// Connect with MT5 config
const brokerService = await connect({
  brokerType: 'mt5',
  brokerServer: 'localhost:8080',
  account: '12345678',
  password: 'your_password',
  server: 'broker_name',
});
```

### 5. Execute MT5 Trade

Same as Alpaca - the UnifiedBrokerService handles both!

---

## 🔄 Integration with Backend

### Save Broker Credentials (Encrypted)

```javascript
// Backend endpoint: POST /api/broker/config
app.post('/api/broker/config', authMiddleware, async (req, res) => {
  const { brokerType, apiKey, secret, account } = req.body;
  
  // Encrypt and store in database
  const encrypted = encrypt(secret);
  
  await pool.query(
    'INSERT INTO broker_credentials (user_id, broker_type, api_key, secret_encrypted, account) VALUES ($1, $2, $3, $4, $5)',
    [req.userId, brokerType, apiKey, encrypted, account]
  );
  
  res.json({ message: 'Broker credentials saved' });
});
```

### Execute Trade on Backend

```javascript
// Backend endpoint: POST /api/trades/{id}/execute-live
app.post('/api/trades/:id/execute-live', authMiddleware, async (req, res) => {
  const trade = await getTrade(req.params.id);
  const brokerCreds = await getBrokerCredentials(req.userId);
  
  // Connect to broker
  const broker = new UnifiedBrokerService(brokerCreds.type, brokerCreds);
  
  // Place order
  const order = await broker.placeOrder({
    pair: trade.pair,
    side: trade.signal_type,
    volume: trade.position_size,
  });
  
  // Save broker order ID to database
  await updateTradeWithBrokerOrder(trade.id, order.orderId);
  
  res.json({ message: 'Order placed', orderId: order.orderId });
});
```

---

## 🧪 Testing

### Test with Paper Trading (Alpaca)

```javascript
// Test order placement
async function testAlpacaIntegration() {
  const broker = new UnifiedBrokerService('alpaca', {
    apiKey: 'your_key',
    apiSecret: 'your_secret',
    isLiveTrading: false, // Paper trading
  });

  // Get balance
  const balance = await broker.getBalance();
  console.log('Balance:', balance);

  // Place test order
  const order = await broker.placeOrder({
    pair: 'AAPL',
    side: 'BUY',
    volume: 1,
    type: 'market',
  });
  console.log('Order placed:', order);

  // Close position
  const closed = await broker.closePosition(order.orderId);
  console.log('Position closed:', closed);
}
```

### Verify on Broker Dashboard

1. Login to broker (Alpaca/MT5)
2. Check Orders tab
3. Verify orders appear
4. Check Positions tab
5. Monitor P&L in real-time

---

## 🚨 Risk Management

### Limits Before Trading

Set in Khanyisa:
- Daily loss limit: `$1,000`
- Max position size: `10%` of balance
- Max risk per trade: `2%`
- Minimum win rate: `50%`

### Broker Safeguards

Both Alpaca and MT5 support:
- ✅ Stop loss orders
- ✅ Take profit orders
- ✅ Position limits
- ✅ Margin monitoring
- ✅ Forced close on margin call

### Order Validation

```javascript
// Before placing order
function validateOrder(order, balance, riskSettings) {
  const { volume, side, entry_price, stop_loss } = order;
  
  // Check risk per trade
  const risk = Math.abs((entry_price - stop_loss) * volume);
  const maxRisk = balance * (riskSettings.maxRiskPerTrade / 100);
  
  if (risk > maxRisk) {
    throw new Error(`Risk ${risk} exceeds limit ${maxRisk}`);
  }
  
  // Check daily loss limit
  if (dailyLoss + risk > riskSettings.dailyLossLimit) {
    throw new Error('Daily loss limit would be exceeded');
  }
  
  return true;
}
```

---

## 📊 Workflow Diagram

```
User Interface
      ↓
useBackendTrades (save to DB)
      ↓
Trade in "pending_approval"
      ↓
User approves trade
      ↓
Trade in "approved"
      ↓
User clicks "Execute"
      ↓
useBroker (connect to Alpaca/MT5)
      ↓
Place order on broker
      ↓
Broker returns order ID
      ↓
Save order ID to trade record
      ↓
Monitor position in real-time
      ↓
Close position
      ↓
Calculate P&L
      ↓
Update performance stats
```

---

## ✅ Integration Checklist

- [ ] Choose broker (Alpaca or MT5)
- [ ] Create account and get API keys
- [ ] Add API keys to `.env`
- [ ] Create `useBroker` hook
- [ ] Test paper trading
- [ ] Implement backend endpoints
- [ ] Save broker credentials encrypted
- [ ] Add risk validation
- [ ] Test full workflow
- [ ] Switch to live trading (if ready)

---

## 📚 Resources

### Alpaca
- API Reference: https://docs.alpaca.markets/
- Python SDK: https://github.com/alpacahq/alpaca-trade-api-python
- WebSocket: https://alpaca.markets/docs/api-references/market-data-api/

### MetaTrader 5
- API Reference: https://www.metatrader5.com/en/docs/
- Python Package: https://pypi.org/project/MetaTrader5/
- ZMQ Bridge: https://github.com/gehtsoft-usa/Forex_Strategy_Builder

---

## 🎉 You're Ready!

Your Khanyisa platform can now execute **real trades** on:
- ✅ Alpaca (stocks, crypto, forex)
- ✅ MetaTrader 5 (forex, stocks, commodities)

Start with **paper trading** to verify everything works, then move to live! 🚀
