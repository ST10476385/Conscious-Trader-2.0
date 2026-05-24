/**
 * Trade Execution Service
 * Manages trade approval workflow and execution
 */

/**
 * Trade execution states
 */
export const TRADE_STATES = {
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXECUTING: "executing",
  EXECUTED: "executed",
  FAILED: "failed",
  CLOSED: "closed",
};

/**
 * Create a new trade signal for approval
 * @param {Object} signalData - Trade signal data
 * @returns {Object} - Trade object ready for approval
 */
export const createTradeForApproval = (signalData) => {
  const {
    pair,
    signal,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    positionSize,
    confidence,
    riskPercentage,
    riskRewardRatio,
    indicators,
    marketCondition,
  } = signalData;

  if (!pair || !signal || !entryPrice || !stopLossPrice) {
    throw new Error("Missing required trade parameters");
  }

  return {
    id: generateTradeId(),
    pair,
    signal, // BUY or SELL
    status: TRADE_STATES.PENDING_APPROVAL,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    positionSize,
    confidence,
    riskPercentage,
    riskRewardRatio,
    indicators,
    marketCondition,
    createdAt: new Date().toISOString(),
    approvedAt: null,
    rejectedAt: null,
    executedAt: null,
    closedAt: null,
    approvalNotes: null,
    rejectionReason: null,
    executionPrice: null,
    pnl: null,
    pnlPercentage: null,
  };
};

/**
 * Approve a trade for execution
 * @param {Object} trade - Trade object
 * @param {string} notes - Optional approval notes
 * @returns {Object} - Updated trade object
 */
export const approveTrade = (trade, notes = "") => {
  if (!trade || !trade.id) {
    throw new Error("Invalid trade object");
  }

  if (trade.status !== TRADE_STATES.PENDING_APPROVAL) {
    throw new Error(`Cannot approve trade with status: ${trade.status}`);
  }

  return {
    ...trade,
    status: TRADE_STATES.APPROVED,
    approvedAt: new Date().toISOString(),
    approvalNotes: notes,
  };
};

/**
 * Reject a trade
 * @param {Object} trade - Trade object
 * @param {string} reason - Rejection reason
 * @returns {Object} - Updated trade object
 */
export const rejectTrade = (trade, reason = "") => {
  if (!trade || !trade.id) {
    throw new Error("Invalid trade object");
  }

  if (trade.status !== TRADE_STATES.PENDING_APPROVAL) {
    throw new Error(`Cannot reject trade with status: ${trade.status}`);
  }

  return {
    ...trade,
    status: TRADE_STATES.REJECTED,
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
  };
};

/**
 * Execute an approved trade
 * @param {Object} trade - Approved trade object
 * @param {number} executionPrice - Actual execution price
 * @returns {Object} - Updated trade object
 */
export const executeTrade = (trade, executionPrice) => {
  if (!trade || !trade.id) {
    throw new Error("Invalid trade object");
  }

  if (trade.status !== TRADE_STATES.APPROVED) {
    throw new Error(
      `Cannot execute trade with status: ${trade.status}. Trade must be approved first.`
    );
  }

  const slippage = calculateSlippage(trade.entryPrice, executionPrice);

  return {
    ...trade,
    status: TRADE_STATES.EXECUTED,
    executedAt: new Date().toISOString(),
    executionPrice,
    slippage,
  };
};

/**
 * Close a trade with final PnL calculation
 * @param {Object} trade - Executed trade object
 * @param {number} closingPrice - Price at which trade is closed
 * @param {string} closeReason - Reason for closing (tp_hit, sl_hit, manual, etc.)
 * @returns {Object} - Updated trade object with PnL
 */
export const closeTrade = (trade, closingPrice, closeReason = "manual") => {
  if (!trade || !trade.id) {
    throw new Error("Invalid trade object");
  }

  if (
    trade.status !== TRADE_STATES.EXECUTED &&
    trade.status !== TRADE_STATES.EXECUTING
  ) {
    throw new Error(`Cannot close trade with status: ${trade.status}`);
  }

  const executionPrice = trade.executionPrice || trade.entryPrice;
  const priceDifference = closingPrice - executionPrice;

  // For SELL orders, profit/loss is reversed
  const pnl =
    trade.signal === "BUY"
      ? priceDifference * trade.positionSize
      : -priceDifference * trade.positionSize;

  const pnlPercentage = ((pnl / (executionPrice * trade.positionSize)) * 100);

  return {
    ...trade,
    status: TRADE_STATES.CLOSED,
    closedAt: new Date().toISOString(),
    closingPrice,
    closeReason,
    pnl: Math.round(pnl * 100) / 100,
    pnlPercentage: Math.round(pnlPercentage * 100) / 100,
  };
};

/**
 * Check if stop loss or take profit has been hit
 * @param {Object} trade - Open trade object
 * @param {number} currentPrice - Current market price
 * @returns {Object} - Status with triggered level
 */
export const checkTradeStopLevels = (trade, currentPrice) => {
  if (trade.status !== TRADE_STATES.EXECUTED) {
    return { triggered: false, level: null };
  }

  const { signal, stopLossPrice, takeProfitPrice } = trade;

  let triggered = false;
  let level = null;
  let reason = null;

  if (signal === "BUY") {
    if (currentPrice <= stopLossPrice) {
      triggered = true;
      level = "stop_loss";
      reason = "Stop loss hit";
    } else if (takeProfitPrice && currentPrice >= takeProfitPrice) {
      triggered = true;
      level = "take_profit";
      reason = "Take profit hit";
    }
  } else if (signal === "SELL") {
    if (currentPrice >= stopLossPrice) {
      triggered = true;
      level = "stop_loss";
      reason = "Stop loss hit";
    } else if (takeProfitPrice && currentPrice <= takeProfitPrice) {
      triggered = true;
      level = "take_profit";
      reason = "Take profit hit";
    }
  }

  return {
    triggered,
    level,
    reason,
    currentPrice,
  };
};

/**
 * Calculate slippage between intended and actual execution price
 * @param {number} intendedPrice - Intended entry price
 * @param {number} actualPrice - Actual execution price
 * @returns {number} - Slippage as percentage
 */
export const calculateSlippage = (intendedPrice, actualPrice) => {
  if (!intendedPrice) return 0;
  const difference = actualPrice - intendedPrice;
  return Math.round((difference / intendedPrice) * 100 * 100) / 100; // Percentage with 2 decimals
};

/**
 * Generate unique trade ID
 * @returns {string} - Trade ID
 */
export const generateTradeId = () => {
  return `TRADE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get trade summary for approval display
 * @param {Object} trade - Trade object
 * @returns {Object} - Summary for UI display
 */
export const getTradeApprovalSummary = (trade) => {
  if (!trade) return null;

  const riskAmount = Math.abs(
    (trade.entryPrice - trade.stopLossPrice) * trade.positionSize
  );
  const rewardAmount = trade.takeProfitPrice
    ? Math.abs((trade.takeProfitPrice - trade.entryPrice) * trade.positionSize)
    : 0;

  return {
    id: trade.id,
    pair: trade.pair,
    signal: trade.signal,
    confidence: trade.confidence,
    entryPrice: Math.round(trade.entryPrice * 10000) / 10000,
    stopLossPrice: Math.round(trade.stopLossPrice * 10000) / 10000,
    takeProfitPrice: trade.takeProfitPrice
      ? Math.round(trade.takeProfitPrice * 10000) / 10000
      : null,
    positionSize: Math.round(trade.positionSize * 100) / 100,
    riskPercentage: trade.riskPercentage,
    riskRewardRatio: Math.round(trade.riskRewardRatio * 100) / 100,
    riskAmount: Math.round(riskAmount * 100) / 100,
    rewardAmount: Math.round(rewardAmount * 100) / 100,
    marketCondition: trade.marketCondition,
    createdAt: trade.createdAt,
  };
};

/**
 * Validate trade execution eligibility
 * @param {Object} trade - Trade object
 * @param {Object} account - Account information
 * @returns {Object} - Validation result
 */
export const validateTradeExecution = (trade, account = {}) => {
  const violations = [];

  // Check trade status
  if (trade.status !== TRADE_STATES.APPROVED) {
    violations.push(
      `Trade must be in APPROVED status. Current status: ${trade.status}`
    );
  }

  // Check account balance
  if (account.balance && account.balance < trade.positionSize) {
    violations.push("Insufficient account balance for position size");
  }

  // Check position limits
  if (
    account.maxOpenPositions &&
    account.openPositions >= account.maxOpenPositions
  ) {
    violations.push("Maximum open positions reached");
  }

  // Check daily loss limit
  if (
    account.dailyPnL &&
    account.dailyLossLimit &&
    account.dailyPnL < -account.dailyLossLimit
  ) {
    violations.push("Daily loss limit exceeded");
  }

  return {
    canExecute: violations.length === 0,
    violations,
  };
};

/**
 * Get execution status for a batch of trades
 * @param {Array<Object>} trades - Array of trade objects
 * @returns {Object} - Execution summary
 */
export const getExecutionSummary = (trades = []) => {
  const statuses = {
    [TRADE_STATES.PENDING_APPROVAL]: [],
    [TRADE_STATES.APPROVED]: [],
    [TRADE_STATES.REJECTED]: [],
    [TRADE_STATES.EXECUTED]: [],
    [TRADE_STATES.CLOSED]: [],
    [TRADE_STATES.FAILED]: [],
  };

  trades.forEach((trade) => {
    if (statuses[trade.status]) {
      statuses[trade.status].push(trade);
    }
  });

  const closedTrades = statuses[TRADE_STATES.CLOSED];
  const winningTrades = closedTrades.filter((t) => t.pnl > 0);
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  return {
    pendingApproval: statuses[TRADE_STATES.PENDING_APPROVAL].length,
    approved: statuses[TRADE_STATES.APPROVED].length,
    rejected: statuses[TRADE_STATES.REJECTED].length,
    executed: statuses[TRADE_STATES.EXECUTED].length,
    closed: statuses[TRADE_STATES.CLOSED].length,
    totalTrades: trades.length,
    winRate:
      closedTrades.length > 0
        ? Math.round((winningTrades.length / closedTrades.length) * 100)
        : 0,
    totalPnL: Math.round(totalPnL * 100) / 100,
  };
};
