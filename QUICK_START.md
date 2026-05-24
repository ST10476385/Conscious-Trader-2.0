# Quick Start Guide: Using Trading Services

---

## 🚀 5-Minute Getting Started

### Step 1: Import Services

```javascript
import { generateTradeSignal } from '@/services/tradeAnalysisEngine';
import { getRiskMetrics } from '@/services/riskManagementService';
import { createTradeForApproval } from '@/services/tradeExecutionService';
import { monitorTrade } from '@/services/tradeMonitoringService';
```

### Step 2: Generate a Trade Signal

```javascript
// Your market data (OHLC)
const ohlcData = {
  closes: [100, 102, 101, 103, 104, 102, 105, 106, 104, 107],
  highs: [101, 103, 102, 104, 105, 103, 106, 107, 105, 108],
  lows: [99, 101, 100, 102, 103, 101, 104, 105, 103, 106]
};

// Generate signal
const signal = generateTradeSignal(ohlcData);
console.log(signal);
// Output: { signal: 'BUY', confidence: 72, trend: 'bullish', ... }
```

### Step 3: Calculate Risk Metrics

```javascript
const riskMetrics = getRiskMetrics({
  accountBalance: 10000,
  entryPrice: 45000,
  stopLossPrice: 44100,
  side: 'BUY',
  riskPercentage: 1,
  riskRewardRatio: 2
});

console.log(riskMetrics);
// {
//   positionSize: 0.5,
//   takeProfit: 46800,
//   potentialProfit: 900,
//   potentialLoss: 450,
//   riskRewardRatio: 2.4
// }
```

### Step 4: Create Trade for Approval

```javascript
const trade = createTradeForApproval({
  pair: 'BTC/USD',
  signal: signal.signal,
  entryPrice: 45000,
  stopLossPrice: 44100,
  takeProfitPrice: 46800,
  positionSize: 0.5,
  confidence: signal.confidence,
  riskPercentage: 1,
  riskRewardRatio: 2.4
});

console.log(trade);
// { id: 'TRADE_xxx', status: 'pending_approval', ... }
```

### Step 5: Use in React Component

```javascript
import { useTradeApprovalWorkflow } from '@/hooks/useTradeServices';
import EnhancedSignalCard from '@/components/signals/EnhancedSignalCard';

export function SignalsPage() {
  const { 
    pendingTrades, 
    approvePendingTrade 
  } = useTradeApprovalWorkflow();

  return (
    <div>
      {pendingTrades.map(trade => (
        <EnhancedSignalCard
          key={trade.id}
          signal={trade}
          onApprove={(id, notes) => approvePendingTrade(id, notes)}
          showActions={true}
          showRiskMetrics={true}
        />
      ))}
    </div>
  );
}
```

---

## 📚 Common Recipes

### Recipe 1: Check Daily Loss Limit

```javascript
import { calculateDailyPerformance } from '@/services/riskManagementService';
import { useDailyLossLimit } from '@/hooks/useTradeServices';

export function Dashboard() {
  const { limitExceeded, remainingDailyRisk } = useDailyLossLimit(
    accountBalance = 10000,
    dailyLossLimit = 2  // 2% = $200
  );

  return (
    <div>
      {limitExceeded && (
        <p style={{ color: 'red' }}>
          Daily loss limit exceeded. No new trades allowed.
        </p>
      )}
      <p>Remaining daily risk: ${remainingDailyRisk}</p>
    </div>
  );
}
```

### Recipe 2: Monitor Open Trades

```javascript
import { useTradeMonitoring } from '@/hooks/useTradeServices';
import TradeMonitoringDashboard from '@/components/dashboard/TradeMonitoringDashboard';

export function ActiveTradesPage({ openTrades, marketPrices }) {
  return (
    <TradeMonitoringDashboard
      openTrades={openTrades}
      marketPrices={marketPrices}
      onCloseTrade={(tradeId) => {
        // Close trade logic
      }}
    />
  );
}
```

### Recipe 3: Validate Trade Before Approval

```javascript
import { validateTradeRisk } from '@/services/riskManagementService';

const isValid = validateTradeRisk(trade, {
  maxRiskPerTrade: 2,        // 2% max risk
  maxPositionSize: 10,       // 10% max of account
  minRiskRewardRatio: 1.5,   // Minimum 1:1.5 ratio
  requireStopLoss: true,
  requireTakeProfit: true
});

if (!isValid.passed) {
  console.log('Trade violations:', isValid.violations);
}
```

### Recipe 4: Get Trade Health Status

```javascript
import { assessTradeHealth } from '@/services/tradeMonitoringService';

const health = assessTradeHealth(trade, currentPrice = 45500);

if (health.status === 'critical') {
  console.log('⚠️  Trade at risk:', health.reason);
  // Show warning to user
}
```

### Recipe 5: Complete Trade Lifecycle

```javascript
import { 
  createTradeForApproval,
  approveTrade,
  executeTrade,
  closeTrade 
} from '@/services/tradeExecutionService';

// 1. Create
const trade = createTradeForApproval(signalData);

// 2. Approve (after user review)
const approved = approveTrade(trade, 'User approved');

// 3. Execute
const executed = executeTrade(approved, executionPrice);

// 4. Monitor (separate function calls)

// 5. Close
const closed = closeTrade(executed, closingPrice, 'tp_hit');
console.log(`P&L: $${closed.pnl}`);
```

---

## 🔍 Debugging Tips

### View Trade State

```javascript
// See full trade object at any state
console.log('Full trade:', trade);

// Check specific fields
console.log('Status:', trade.status);
console.log('Entry:', trade.entryPrice);
console.log('Stop Loss:', trade.stopLossPrice);
console.log('Take Profit:', trade.takeProfitPrice);
```

### Check Calculations

```javascript
// Verify position size
console.log('Position size:', riskMetrics.positionSize);
console.log('Risk amount:', riskMetrics.riskAmount);
console.log('Max allocation %:', riskMetrics.maxAllocationPercentage);

// Verify profit/loss potential
console.log('Potential profit:', riskMetrics.potentialProfit);
console.log('Potential loss:', riskMetrics.potentialLoss);
console.log('Risk-reward:', riskMetrics.riskRewardRatio);
```

### Monitor Alerts

```javascript
const monitoring = monitorTrade(trade, marketData);

// Check for any alerts
if (monitoring.alerts.length > 0) {
  monitoring.alerts.forEach(alert => {
    console.log(`Alert: ${alert.message}`);
    console.log(`Severity: ${alert.severity}`);
  });
}
```

---

## ⚡ Performance Tips

### 1. Batch Monitor Multiple Trades

Instead of:
```javascript
// ❌ Inefficient
trades.forEach(trade => {
  monitorTrade(trade, marketData[trade.pair]);
});
```

Use:
```javascript
// ✅ Better
import { batchMonitorTrades } from '@/services/tradeMonitoringService';
const results = batchMonitorTrades(trades, priceData);
```

### 2. Memoize Expensive Calculations

```javascript
import { useMemo } from 'react';

export function TradeCard({ trade, marketData }) {
  const monitoring = useMemo(
    () => monitorTrade(trade, marketData),
    [trade, marketData]
  );

  return <div>{monitoring.unrealizedPnL}</div>;
}
```

### 3. Use Hooks for State Management

```javascript
// ✅ Good: Hooks handle state
const { openTrades, closeOpenTrade } = useTradeExecution();

// ❌ Bad: Manual state management
const [trades, setTrades] = useState([]);
```

---

## 🚨 Error Handling

### Wrap Service Calls

```javascript
try {
  const signal = generateTradeSignal(ohlcData);
  if (!signal || signal.signal === 'NEUTRAL') {
    console.warn('No clear signal');
    return;
  }
} catch (error) {
  console.error('Error generating signal:', error);
}
```

### Validate Input Data

```javascript
function validateOHLCData(ohlcData) {
  if (!ohlcData || !ohlcData.closes) {
    throw new Error('Invalid OHLC data');
  }
  if (ohlcData.closes.length < 26) {
    throw new Error('Insufficient data for analysis');
  }
  return true;
}
```

### API Error Handling

```javascript
import { tradeExecutionAPI } from '@/api/tradeServicesAPI';

try {
  const result = await tradeExecutionAPI.approveTrade(tradeId);
} catch (error) {
  if (error.status === 403) {
    console.error('Insufficient permissions');
  } else if (error.status === 400) {
    console.error('Invalid trade data:', error.message);
  }
}
```

---

## 📊 Common Patterns

### Pattern 1: Signal Generation → Approval → Execution

```javascript
const signal = generateTradeSignal(ohlcData);
const trade = createTradeForApproval({...signal, ...riskMetrics});
const approved = approveTrade(trade);
const executed = executeTrade(approved, executionPrice);
```

### Pattern 2: Monitoring Loop

```javascript
const monitoring = monitorTrade(trade, currentMarketData);
const health = assessTradeHealth(trade, currentPrice);

if (monitoring.alerts.length > 0) {
  handleAlerts(monitoring.alerts);
}
```

### Pattern 3: Daily Risk Check

```javascript
const { limitExceeded } = useDailyLossLimit(balance, limit);

if (limitExceeded) {
  disableNewTrades();
  showWarning('Daily loss limit reached');
}
```

---

## 🎯 Next: Integration with Backend

Once you understand the services, connect to your backend:

1. Implement backend endpoints matching `src/api/tradeServicesAPI.js`
2. Add authentication headers
3. Replace mock data with real market data
4. Deploy to production

See `TRADING_SERVICES_README.md` for complete integration guide.

---

**Happy trading! 🚀**
