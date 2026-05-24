# Conscious Trader - Backend Services Documentation

This document explains the backend trading services added to support a complete semi-automated trading workflow.

---

## 📋 Overview

The backend system provides four core services:

1. **Trade Analysis Engine** - Generate trade signals from market data
2. **Risk Management Service** - Calculate position sizing and risk metrics
3. **Trade Execution Service** - Manage trade approval and execution workflow
4. **Trade Monitoring Service** - Monitor open trades and generate alerts

---

## 🔧 Services Architecture

### 1. Trade Analysis Engine (`src/services/tradeAnalysisEngine.js`)

Generates trading signals based on technical indicators.

#### Key Functions

- **`generateTradeSignal(ohlcData, config)`** - Main function to generate a complete trade signal
  - Analyzes RSI, SMA, MACD, Bollinger Bands
  - Returns: `{ signal, confidence, trend, indicators, buySignals, sellSignals }`

- **`calculateRSI(prices, period)`** - Relative Strength Index
- **`calculateSMA(prices, period)`** - Simple Moving Average  
- **`calculateMACD(prices)`** - Moving Average Convergence Divergence
- **`calculateBollingerBands(prices, period, deviation)`** - Volatility bands
- **`analyzeMarketCondition(ohlcData)`** - Market trend analysis
- **`calculateVolatility(prices, period)`** - Price volatility measurement

#### Usage Example

```javascript
import { generateTradeSignal } from '@/services/tradeAnalysisEngine';

const ohlcData = {
  closes: [100, 102, 101, 103, 104, 102, 105],
  highs: [101, 103, 102, 104, 105, 103, 106],
  lows: [99, 101, 100, 102, 103, 101, 104],
  opens: [100.5, 101.5, 102, 101.5, 103.5, 103, 102.5]
};

const signal = generateTradeSignal(ohlcData);
// Returns: { signal: 'BUY', confidence: 75, trend: 'bullish', indicators: {...} }
```

---

### 2. Risk Management Service (`src/services/riskManagementService.js`)

Manages position sizing, stop losses, take profits, and risk limits.

#### Key Functions

- **`calculatePositionSize(params)`** - Calculate trade size based on account risk
  - Input: `{ accountBalance, riskPercentage, entryPrice, stopLossPrice }`
  - Returns: `{ positionSize, riskAmount, priceDifference, maxAllocationPercentage }`

- **`calculateStopLoss(params)`** - Calculate stop loss level
  - Supports ATR-based or percentage-based calculation

- **`calculateTakeProfit(params)`** - Calculate take profit based on risk-reward ratio
  - Input: `{ entryPrice, stopLossPrice, riskRewardRatio, side }`

- **`validateTradeRisk(trade, riskParams)`** - Validate trade against risk rules
  - Returns violations if trade exceeds limits

- **`calculateDailyPerformance(trades)`** - Track daily P&L and win rate
- **`checkDailyLossLimit(performance, limit, isPercentage)`** - Check if daily loss limit exceeded
- **`getRiskMetrics(tradeParams)`** - Get complete risk metrics for a trade

#### Usage Example

```javascript
import { getRiskMetrics } from '@/services/riskManagementService';

const riskMetrics = getRiskMetrics({
  accountBalance: 10000,
  entryPrice: 45000,
  stopLossPrice: 44100,
  side: 'BUY',
  riskPercentage: 1,
  riskRewardRatio: 2
});

// Returns: {
//   positionSize: 0.5,
//   takeProfit: 46800,
//   riskRewardRatio: 2.4,
//   potentialProfit: 900,
//   potentialLoss: 450
// }
```

---

### 3. Trade Execution Service (`src/services/tradeExecutionService.js`)

Manages the trade approval and execution workflow.

#### Key Functions

- **`createTradeForApproval(signalData)`** - Create a trade pending user approval
  - Returns: Trade object with status `pending_approval`

- **`approveTrade(trade, notes)`** - Approve a pending trade
  - Returns: Updated trade with status `approved`

- **`rejectTrade(trade, reason)`** - Reject a pending trade
  - Returns: Updated trade with status `rejected`

- **`executeTrade(trade, executionPrice)`** - Execute an approved trade
  - Records actual execution price and slippage

- **`closeTrade(trade, closingPrice, reason)`** - Close an open trade
  - Calculates final P&L and P&L percentage

- **`checkTradeStopLevels(trade, currentPrice)`** - Check if SL or TP is hit
  - Returns: `{ triggered, level, reason }`

- **`validateTradeExecution(trade, account)`** - Validate before execution
  - Checks account balance, position limits, daily loss limit

- **`getTradeApprovalSummary(trade)`** - Format trade for approval display
- **`getExecutionSummary(trades)`** - Get batch execution statistics

#### Trade States

```javascript
TRADE_STATES = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXECUTING: 'executing',
  EXECUTED: 'executed',
  FAILED: 'failed',
  CLOSED: 'closed'
}
```

#### Usage Example

```javascript
import {
  createTradeForApproval,
  approveTrade,
  executeTrade,
  closeTrade
} from '@/services/tradeExecutionService';

// Create trade for approval
const trade = createTradeForApproval({
  pair: 'BTC/USD',
  signal: 'BUY',
  entryPrice: 45000,
  stopLossPrice: 44100,
  takeProfitPrice: 46800,
  positionSize: 0.5,
  confidence: 75,
  riskPercentage: 1,
  riskRewardRatio: 2.4
});

// User approves
const approved = approveTrade(trade, 'Good signal confirmation');

// Execute trade
const executed = executeTrade(approved, 45010); // Actual execution price

// Close trade
const closed = closeTrade(executed, 46800, 'tp_hit');
console.log(`P&L: $${closed.pnl} (${closed.pnlPercentage}%)`);
```

---

### 4. Trade Monitoring Service (`src/services/tradeMonitoringService.js`)

Real-time monitoring of open trades and alert generation.

#### Key Functions

- **`monitorTrade(trade, marketData)`** - Monitor a trade for alerts
  - Returns: `{ unrealizedPnL, alerts, monitoring }`

- **`checkStopLevels(trade, currentPrice)`** - Check if SL/TP hit
- **`checkVolatility(trade, marketData)`** - Detect volatility spikes
- **`checkDistanceToLevels(trade, currentPrice)`** - Alert when approaching SL
- **`calculateUnrealizedPnL(trade, currentPrice)`** - Calculate current P&L
- **`assessTradeHealth(trade, currentPrice)`** - Get trade health status
- **`generateMonitoringDashboard(trades, marketDataMap)`** - Get all trades status
- **`batchMonitorTrades(trades, priceData)`** - Efficiently monitor multiple trades

#### Usage Example

```javascript
import { monitorTrade, assessTradeHealth } from '@/services/tradeMonitoringService';

const monitoring = monitorTrade(trade, {
  currentPrice: 45500,
  high: 45600,
  low: 45400
});

// monitoring returns:
// {
//   tradeId: 'TRADE_xxx',
//   unrealizedPnL: 250,
//   unrealizedPnLPercentage: 5.55,
//   alerts: [],
//   monitoring: {
//     distanceToStopLoss: 1400,
//     distanceToTakeProfit: 1300,
//     timeOpenMinutes: 45
//   }
// }

const health = assessTradeHealth(trade, 45500);
// health: { status: 'profitable', unrealizedPnLPercentage: 5.55 }
```

---

## 🪝 React Hooks Integration (`src/hooks/useTradeServices.js`)

Custom hooks for integrating services with React components.

### Available Hooks

- **`useTradeAnalysis(ohlcData, config)`** - Generate trade signals
- **`useRiskCalculation(tradeParams)`** - Calculate risk metrics
- **`useTradeApprovalWorkflow()`** - Manage approval workflow
- **`useTradeExecution()`** - Manage trade execution
- **`useTradeMonitoring(trade, marketData)`** - Monitor open trades
- **`useDailyLossLimit(accountBalance, limit)`** - Track daily P&L
- **`usePositionSizing(params)`** - Calculate position size

#### Usage Example

```javascript
import { useTradeApprovalWorkflow } from '@/hooks/useTradeServices';

export function MyComponent() {
  const {
    pendingTrades,
    approvedTrades,
    addPendingTrade,
    approvePendingTrade,
    rejectPendingTrade
  } = useTradeApprovalWorkflow();

  const handleApproveSignal = (signal) => {
    const trade = addPendingTrade(signal);
    approvePendingTrade(trade.id, 'User approved');
  };

  return (
    <div>
      {pendingTrades.map(trade => (
        <button key={trade.id} onClick={() => handleApproveSignal(trade)}>
          Approve {trade.pair}
        </button>
      ))}
    </div>
  );
}
```

---

## 🎨 UI Components

### EnhancedSignalCard (`src/components/signals/EnhancedSignalCard.jsx`)

Enhanced signal card with trade approval workflow.

**Features:**
- Display trade signal with confidence score
- Show risk metrics (position size, potential loss/profit)
- Technical indicator overlay
- Approve/Reject buttons with optional notes
- Execute button for approved trades
- Status badges for different trade states

**Props:**
```javascript
<EnhancedSignalCard
  signal={signalData}
  onApprove={(id, notes) => {}}
  onReject={(id) => {}}
  onExecute={(id) => {}}
  showActions={true}
  showRiskMetrics={true}
  tradeStatus="pending_approval" // or "approved", "executed", "rejected"
/>
```

### TradeMonitoringDashboard (`src/components/dashboard/TradeMonitoringDashboard.jsx`)

Display and monitor all open trades in real-time.

**Features:**
- List all open trades with current P&L
- Display distance to stop loss and take profit
- Show alerts when levels are approached
- Close trade button
- Trade health indicator (healthy, warning, critical, profitable)

**Props:**
```javascript
<TradeMonitoringDashboard
  openTrades={openTrades}
  marketPrices={{ 'BTC/USD': 45500, 'ETH/USD': 2500 }}
  onCloseTrade={(tradeId) => {}}
  onModifyTrade={(tradeId) => {}}
/>
```

### RiskControlsPanel (`src/components/dashboard/RiskControlsPanel.jsx`)

Risk management dashboard showing daily limits and controls.

**Features:**
- Daily loss limit tracker with progress bar
- Total exposure limit monitoring
- Open position counter
- Risk status summary
- Stop all trades button

**Props:**
```javascript
<RiskControlsPanel
  accountBalance={10000}
  dailyPnL={-150}
  dailyLossLimit={2}
  openPositions={2}
  maxOpenPositions={5}
  totalExposure={5000}
  maxExposurePercentage={20}
  onStopAllTrades={() => {}}
  onAdjustLimits={() => {}}
/>
```

---

## 🔗 API Integration (`src/api/tradeServicesAPI.js`)

Templates for connecting frontend services to backend endpoints.

### Available API Modules

- **`tradeAnalysisAPI`** - Save and retrieve signals
- **`tradeExecutionAPI`** - Trade CRUD and workflow
- **`riskManagementAPI`** - Account risk settings
- **`monitoringAPI`** - Real-time monitoring
- **`analyticsAPI`** - Performance metrics
- **`marketDataAPI`** - Market data fetching
- **`webhooksAPI`** - Webhook management

#### Usage Example

```javascript
import { tradeExecutionAPI, riskManagementAPI } from '@/api/tradeServicesAPI';

// Create trade
const trade = await tradeExecutionAPI.createTradeForApproval({
  pair: 'BTC/USD',
  signal: 'BUY',
  entryPrice: 45000,
  // ... other params
});

// Approve trade
await tradeExecutionAPI.approveTrade(trade.id, 'Good setup');

// Check daily loss limit
const riskStatus = await riskManagementAPI.checkDailyLossLimitStatus();
if (riskStatus.exceeded) {
  // Stop new trades
}
```

---

## 📊 Complete Trade Flow Example

See `src/services/tradeFlowExamples.js` for complete examples:

1. **Generate Signal** - Analyze market data
2. **Create for Approval** - Calculate risk metrics
3. **User Approval** - Manual trade review
4. **Execution** - Place trade with broker
5. **Monitoring** - Real-time P&L and alerts
6. **Closing** - Close trade and record P&L

---

## ⚠️ Risk Control Features

### Daily Loss Limit
- Percentage-based daily loss limit
- Automatically calculated from account balance
- Stops new trade approvals when exceeded

### Position Sizing
- Risk-based position sizing
- Max allocation per trade
- Stop loss and take profit based on R:R ratio

### Multiple Risk Checks
- Trade validation before execution
- Account balance verification
- Daily loss limit check
- Max open positions limit
- Exposure percentage limit

### Monitoring Alerts
- Stop loss/take profit approach alerts
- Volatility spike detection
- Trade health assessment
- Real-time P&L tracking

---

## 🚀 Integration Checklist

- [ ] Connect market data API for OHLC data
- [ ] Implement trade execution with broker (MT5, Binance, etc.)
- [ ] Set up real-time price monitoring
- [ ] Create backend endpoints for API templates
- [ ] Add authentication and authorization
- [ ] Implement trade history persistence
- [ ] Set up email/SMS alerts
- [ ] Add trade logging and audit trail
- [ ] Deploy to production with proper scaling

---

## 📝 Notes

- All calculations are done in the frontend for speed
- Backend integration via `khanyisaClient` templates provided
- Services are purely functional (no internal state)
- Components are stateless and props-driven
- Hooks manage component-level state
- APIs follow consistent error handling pattern

---
