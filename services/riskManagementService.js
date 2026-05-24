/**
 * Risk Management Service
 * Manages position sizing, stop losses, take profits, and risk limits
 */

/**
 * Calculate position size based on account risk
 * @param {Object} params - Position sizing parameters
 * @param {number} params.accountBalance - Total account balance
 * @param {number} params.riskPercentage - Risk percentage per trade (0-5 typically)
 * @param {number} params.entryPrice - Entry price
 * @param {number} params.stopLossPrice - Stop loss price
 * @returns {Object} - Position details
 */
export const calculatePositionSize = ({
  accountBalance,
  riskPercentage = 1,
  entryPrice,
  stopLossPrice,
}) => {
  if (!accountBalance || !entryPrice || !stopLossPrice) {
    throw new Error("Missing required parameters for position sizing");
  }

  // Risk amount in account currency
  const riskAmount = (accountBalance * riskPercentage) / 100;

  // Calculate pip/point distance
  const priceDifference = Math.abs(entryPrice - stopLossPrice);

  if (priceDifference === 0) {
    throw new Error("Stop loss and entry price cannot be the same");
  }

  // Calculate contract/unit size
  const positionSize = riskAmount / priceDifference;

  // Calculate potential loss and profit metrics
  const potentialLoss = riskAmount;
  const maxAllocationPercentage = (riskAmount / accountBalance) * 100;

  return {
    positionSize: Math.round(positionSize * 100) / 100,
    riskAmount,
    priceDifference,
    maxAllocationPercentage: Math.round(maxAllocationPercentage * 100) / 100,
    riskRewardRatio: null, // Will be calculated with take profit
  };
};

/**
 * Calculate take profit based on risk-reward ratio
 * @param {Object} params - Take profit parameters
 * @param {number} params.entryPrice - Entry price
 * @param {number} params.stopLossPrice - Stop loss price
 * @param {number} params.riskRewardRatio - Risk-reward ratio (e.g., 1:2, 1:3)
 * @param {string} params.side - Trade side (BUY or SELL)
 * @returns {number} - Take profit price
 */
export const calculateTakeProfit = ({
  entryPrice,
  stopLossPrice,
  riskRewardRatio = 2,
  side,
}) => {
  if (!entryPrice || !stopLossPrice) {
    throw new Error("Missing required parameters for take profit calculation");
  }

  const riskDistance = Math.abs(entryPrice - stopLossPrice);
  const profitDistance = riskDistance * riskRewardRatio;

  if (side === "BUY") {
    return entryPrice + profitDistance;
  } else if (side === "SELL") {
    return entryPrice - profitDistance;
  }

  throw new Error("Invalid side. Must be BUY or SELL");
};

/**
 * Calculate suggested stop loss based on ATR or percentage
 * @param {Object} params - Stop loss parameters
 * @param {number} params.entryPrice - Entry price
 * @param {string} params.side - Trade side
 * @param {number} params.atr - Average True Range (optional)
 * @param {number} params.stopLossPercentage - Stop loss as percentage (default 2%)
 * @param {number} params.atmMultiplier - ATR multiplier (default 1.5)
 * @returns {number} - Stop loss price
 */
export const calculateStopLoss = ({
  entryPrice,
  side,
  atr = null,
  stopLossPercentage = 2,
  atmMultiplier = 1.5,
}) => {
  if (!entryPrice || !side) {
    throw new Error("Missing required parameters for stop loss calculation");
  }

  let stopLossDistance;

  // Use ATR if available
  if (atr) {
    stopLossDistance = atr * atmMultiplier;
  } else {
    // Otherwise use percentage
    stopLossDistance = entryPrice * (stopLossPercentage / 100);
  }

  if (side === "BUY") {
    return entryPrice - stopLossDistance;
  } else if (side === "SELL") {
    return entryPrice + stopLossDistance;
  }

  throw new Error("Invalid side. Must be BUY or SELL");
};

/**
 * Validate trade against risk parameters
 * @param {Object} trade - Trade object
 * @param {Object} riskParams - Risk parameters
 * @returns {Object} - Validation result with passed flag and violations
 */
export const validateTradeRisk = (trade, riskParams = {}) => {
  const {
    maxRiskPerTrade = 2, // %
    maxPositionSize = 5, // % of account
    minRiskRewardRatio = 1.5,
    requireStopLoss = true,
    requireTakeProfit = true,
  } = riskParams;

  const violations = [];

  // Check stop loss requirement
  if (requireStopLoss && !trade.stopLoss) {
    violations.push("Stop loss is required");
  }

  // Check take profit requirement
  if (requireTakeProfit && !trade.takeProfit) {
    violations.push("Take profit is required");
  }

  // Check risk percentage
  if (trade.riskPercentage > maxRiskPerTrade) {
    violations.push(
      `Risk percentage ${trade.riskPercentage}% exceeds maximum ${maxRiskPerTrade}%`
    );
  }

  // Check position size
  if (trade.positionSizePercentage > maxPositionSize) {
    violations.push(
      `Position size ${trade.positionSizePercentage}% exceeds maximum ${maxPositionSize}%`
    );
  }

  // Check risk-reward ratio
  if (
    trade.stopLoss &&
    trade.takeProfit &&
    trade.riskRewardRatio < minRiskRewardRatio
  ) {
    violations.push(
      `Risk-reward ratio ${trade.riskRewardRatio.toFixed(2)} is below minimum ${minRiskRewardRatio}`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
    valid: violations.length === 0,
  };
};

/**
 * Track daily trading performance
 * @param {Array<Object>} trades - Array of completed trades
 * @returns {Object} - Daily performance metrics
 */
export const calculateDailyPerformance = (trades = []) => {
  const today = new Date().toDateString();
  const todaysTrades = trades.filter(
    (t) => new Date(t.closedAt || t.createdAt).toDateString() === today
  );

  if (todaysTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      totalPnLPercentage: 0,
      largestWin: 0,
      largestLoss: 0,
    };
  }

  const totalPnL = todaysTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = todaysTrades.filter((t) => (t.pnl || 0) > 0).length;
  const losingTrades = todaysTrades.filter((t) => (t.pnl || 0) < 0).length;
  const largestWin = Math.max(...todaysTrades.map((t) => t.pnl || 0));
  const largestLoss = Math.min(...todaysTrades.map((t) => t.pnl || 0));

  return {
    totalTrades: todaysTrades.length,
    winningTrades,
    losingTrades,
    winRate: Math.round((winningTrades / todaysTrades.length) * 100),
    totalPnL,
    totalPnLPercentage: 0, // Will be calculated if account balance is available
    largestWin,
    largestLoss,
  };
};

/**
 * Check if daily loss limit is exceeded
 * @param {Object} performance - Daily performance object
 * @param {number} dailyLossLimit - Daily loss limit in amount or percentage
 * @param {boolean} isPercentage - Whether limit is percentage-based
 * @returns {Object} - Daily limit status
 */
export const checkDailyLossLimit = (
  performance,
  dailyLossLimit = 2,
  isPercentage = true
) => {
  const absoluteLoss = Math.abs(Math.min(0, performance.totalPnL));

  return {
    exceeded:
      !isPercentage && absoluteLoss > dailyLossLimit
        ? true
        : isPercentage && performance.totalPnLPercentage < -dailyLossLimit
        ? true
        : false,
    currentLoss: absoluteLoss,
    currentLossPercentage: performance.totalPnLPercentage,
    limit: dailyLossLimit,
    isPercentage,
  };
};

/**
 * Get risk metrics for a potential trade
 * @param {Object} tradeParams - Trade parameters
 * @returns {Object} - Complete risk metrics
 */
export const getRiskMetrics = (tradeParams) => {
  const {
    accountBalance,
    entryPrice,
    stopLossPrice,
    side,
    riskPercentage = 1,
    riskRewardRatio = 2,
  } = tradeParams;

  const positionSizing = calculatePositionSize({
    accountBalance,
    riskPercentage,
    entryPrice,
    stopLossPrice,
  });

  const takeProfit = calculateTakeProfit({
    entryPrice,
    stopLossPrice,
    riskRewardRatio,
    side,
  });

  const riskDistance = Math.abs(entryPrice - stopLossPrice);
  const profitDistance = Math.abs(takeProfit - entryPrice);
  const actualRiskRewardRatio = profitDistance / riskDistance;

  return {
    ...positionSizing,
    takeProfit: Math.round(takeProfit * 100) / 100,
    stopLossPrice: Math.round(stopLossPrice * 100) / 100,
    entryPrice,
    side,
    riskRewardRatio: Math.round(actualRiskRewardRatio * 100) / 100,
    potentialProfit: Math.round(positionSizing.positionSize * profitDistance * 100) / 100,
    potentialLoss: Math.round(positionSizing.riskAmount * 100) / 100,
  };
};
