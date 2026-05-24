/**
 * Integration Example: Complete Trade Flow
 * This file demonstrates how to use all trading services together
 */

import { generateTradeSignal } from "@/services/tradeAnalysisEngine";
import {
  calculatePositionSize,
  calculateTakeProfit,
  calculateStopLoss,
  getRiskMetrics,
  validateTradeRisk,
} from "@/services/riskManagementService";
import {
  createTradeForApproval,
  approveTrade,
  executeTrade,
  closeTrade,
  checkTradeStopLevels,
} from "@/services/tradeExecutionService";
import { monitorTrade, assessTradeHealth } from "@/services/tradeMonitoringService";

/**
 * Example 1: Generate a trade signal from market data
 * and create it for approval with full risk metrics
 */
export function exampleGenerateAndApproveSignal() {
  // Mock OHLC data
  const ohlcData = {
    closes: [100, 102, 101, 103, 104, 102, 105, 106, 104, 107],
    highs: [101, 103, 102, 104, 105, 103, 106, 107, 105, 108],
    lows: [99, 101, 100, 102, 103, 101, 104, 105, 103, 106],
    opens: [100.5, 101.5, 102, 101.5, 103.5, 103, 102.5, 105.5, 106, 104],
  };

  const pair = "BTC/USD";
  const accountBalance = 10000;
  const riskPercentage = 1;
  const riskRewardRatio = 2;

  // Step 1: Generate trade signal based on technical analysis
  const signal = generateTradeSignal(ohlcData);
  console.log("📊 Generated Signal:", signal);

  if (!signal || signal.signal === "NEUTRAL") {
    console.log("No clear signal detected");
    return null;
  }

  // Step 2: Calculate risk management parameters
  const entryPrice = ohlcData.closes[ohlcData.closes.length - 1];
  const stopLossPrice = calculateStopLoss({
    entryPrice,
    side: signal.signal,
    stopLossPercentage: 2,
  });

  const riskMetrics = getRiskMetrics({
    accountBalance,
    entryPrice,
    stopLossPrice,
    side: signal.signal,
    riskPercentage,
    riskRewardRatio,
  });

  console.log("💰 Risk Metrics:", riskMetrics);

  // Step 3: Create trade for approval
  const tradeForApproval = createTradeForApproval({
    pair,
    signal: signal.signal,
    entryPrice,
    stopLossPrice: riskMetrics.stopLossPrice,
    takeProfitPrice: riskMetrics.takeProfit,
    positionSize: riskMetrics.positionSize,
    confidence: signal.confidence,
    riskPercentage,
    riskRewardRatio: riskMetrics.riskRewardRatio,
    indicators: signal.indicators,
    marketCondition: signal.marketCondition,
    riskMetrics,
  });

  console.log("✅ Trade created for approval:", tradeForApproval);

  return {
    trade: tradeForApproval,
    signal,
    riskMetrics,
  };
}

/**
 * Example 2: Approve and execute a trade
 */
export function exampleExecuteTrade(trade) {
  if (!trade) {
    console.log("No trade to execute");
    return null;
  }

  // Step 1: Approve the trade
  const approvedTrade = approveTrade(trade, "Signal confirmed with good R:R ratio");
  console.log("✓ Trade approved:", approvedTrade);

  // Step 2: Execute the trade (in real scenario, this would interact with broker API)
  const executionPrice = trade.entryPrice * 1.001; // Slight slippage
  const executedTrade = executeTrade(approvedTrade, executionPrice);
  console.log("⚡ Trade executed:", executedTrade);

  return executedTrade;
}

/**
 * Example 3: Monitor an open trade in real-time
 */
export function exampleMonitorOpenTrade(trade) {
  // Mock market data updates
  const marketUpdates = [
    { currentPrice: trade.entryPrice * 1.005, high: trade.entryPrice * 1.01, low: trade.entryPrice },
    { currentPrice: trade.entryPrice * 1.01, high: trade.entryPrice * 1.015, low: trade.entryPrice * 0.995 },
    { currentPrice: trade.entryPrice * 1.02, high: trade.entryPrice * 1.025, low: trade.entryPrice * 0.99 },
  ];

  console.log("\n📈 Monitoring trade in real-time:");

  marketUpdates.forEach((marketData, index) => {
    console.log(`\nPrice Update ${index + 1}:`);

    // Monitor the trade
    const monitoring = monitorTrade(trade, marketData);
    console.log("Monitoring Data:", monitoring);

    // Check health
    const health = assessTradeHealth(trade, marketData.currentPrice);
    console.log("Trade Health:", health);

    // Check for stop/profit levels
    const stopCheck = checkTradeStopLevels(trade, marketData.currentPrice);
    if (stopCheck.triggered) {
      console.log("⚠️  ALERT:", stopCheck.reason);
    }
  });
}

/**
 * Example 4: Close a trade with PnL calculation
 */
export function exampleCloseTrade(trade) {
  if (!trade) {
    console.log("No trade to close");
    return null;
  }

  const closingPrice = trade.entryPrice * 1.015; // Close at 1.5% profit

  const closedTrade = closeTrade(trade, closingPrice, "manual");
  console.log("✓ Trade closed:", closedTrade);
  console.log(`PnL: $${closedTrade.pnl} (${closedTrade.pnlPercentage}%)`);

  return closedTrade;
}

/**
 * Example 5: Complete trade lifecycle
 */
export function exampleCompleteTradeLifecycle() {
  console.log("=== COMPLETE TRADE LIFECYCLE EXAMPLE ===\n");

  // Generate signal
  const { trade, signal, riskMetrics } = exampleGenerateAndApproveSignal();
  if (!trade) return;

  // Execute trade
  const executedTrade = exampleExecuteTrade(trade);

  // Monitor trade
  exampleMonitorOpenTrade(executedTrade);

  // Close trade
  exampleCloseTrade(executedTrade);
}

/**
 * Example 6: Multiple trades with daily loss limit
 */
export function exampleDailyRiskManagement() {
  const accountBalance = 10000;
  const dailyLossLimit = 2; // 2% = $200

  const trades = [
    { pnl: 50, closedAt: new Date().toISOString() },
    { pnl: -75, closedAt: new Date().toISOString() },
    { pnl: 25, closedAt: new Date().toISOString() },
    { pnl: -100, closedAt: new Date().toISOString() }, // This would exceed limit
  ];

  const today = new Date().toDateString();
  let totalPnL = 0;
  let tradeCount = 0;

  console.log("\n=== DAILY RISK MANAGEMENT ===\n");
  console.log(`Daily Loss Limit: ${dailyLossLimit}% = $${(dailyLossLimit / 100) * accountBalance}`);
  console.log("---\n");

  trades.forEach((trade, index) => {
    const dayMatch = new Date(trade.closedAt).toDateString() === today;

    if (dayMatch) {
      totalPnL += trade.pnl;
      tradeCount++;

      const dailyPnLPercentage = (totalPnL / accountBalance) * 100;
      const limitExceeded = dailyPnLPercentage < -dailyLossLimit;

      console.log(`Trade ${index + 1}: ${trade.pnl > 0 ? "+" : ""}${trade.pnl}`);
      console.log(`Cumulative PnL: ${totalPnL > 0 ? "+" : ""}${totalPnL} (${dailyPnLPercentage.toFixed(2)}%)`);

      if (limitExceeded) {
        console.log("⛔ DAILY LOSS LIMIT EXCEEDED - TRADING HALTED\n");
      } else {
        console.log("✓ Within limit\n");
      }
    }
  });

  return {
    totalTrades: tradeCount,
    totalPnL,
    dailyPnLPercentage: (totalPnL / accountBalance) * 100,
    limitExceeded: (totalPnL / accountBalance) * 100 < -dailyLossLimit,
  };
}

/**
 * Example 7: Risk validation before trade execution
 */
export function exampleValidateTradeRisk() {
  const tradeData = {
    pair: "BTC/USD",
    signal: "BUY",
    entryPrice: 45000,
    stopLossPrice: 44100,
    takeProfitPrice: 46800,
    positionSize: 0.5,
    riskPercentage: 1,
    riskRewardRatio: 2.4,
    positionSizePercentage: 5,
  };

  const riskParams = {
    maxRiskPerTrade: 2,
    maxPositionSize: 10,
    minRiskRewardRatio: 1.5,
    requireStopLoss: true,
    requireTakeProfit: true,
  };

  console.log("\n=== TRADE RISK VALIDATION ===\n");

  const validation = validateTradeRisk(tradeData, riskParams);

  console.log("Trade Data:", tradeData);
  console.log("\nRisk Parameters:", riskParams);
  console.log("\nValidation Result:", validation);

  if (validation.passed) {
    console.log("✅ Trade passed all risk checks");
  } else {
    console.log("❌ Trade failed risk validation:");
    validation.violations.forEach((v) => console.log(`  - ${v}`));
  }

  return validation;
}

// Export for testing
export const examples = {
  generateAndApproveSignal: exampleGenerateAndApproveSignal,
  executeTrade: exampleExecuteTrade,
  monitorOpenTrade: exampleMonitorOpenTrade,
  closeTrade: exampleCloseTrade,
  completeLifecycle: exampleCompleteTradeLifecycle,
  dailyRiskManagement: exampleDailyRiskManagement,
  validateTradeRisk: exampleValidateTradeRisk,
};
