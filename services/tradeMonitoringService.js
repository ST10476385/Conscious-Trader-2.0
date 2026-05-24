/**
 * Trade Monitoring Service
 * Monitors open trades, triggers alerts, and updates trade status
 */

/**
 * Monitor a trade for stop loss / take profit / alerts
 * @param {Object} trade - Open trade object
 * @param {Object} marketData - Current market data
 * @returns {Object} - Monitoring result with alerts
 */
export const monitorTrade = (trade, marketData) => {
  if (!trade || !marketData || !marketData.currentPrice) {
    return null;
  }

  const alerts = [];
  const { currentPrice, high, low } = marketData;

  // Check stop loss / take profit
  const priceCheck = checkStopLevels(trade, currentPrice);

  if (priceCheck.hitLevel) {
    alerts.push({
      type: priceCheck.hitLevel,
      message: `${priceCheck.hitLevel.toUpperCase()} hit at ${currentPrice}`,
      severity: "critical",
      action: "close_trade",
      price: currentPrice,
    });
  }

  // Check volatility
  const volatilityAlert = checkVolatility(trade, marketData);
  if (volatilityAlert) {
    alerts.push(volatilityAlert);
  }

  // Check price distance to stop/profit
  const distanceAlert = checkDistanceToLevels(trade, currentPrice);
  if (distanceAlert) {
    alerts.push(distanceAlert);
  }

  // Calculate unrealized PnL
  const unrealizedPnL = calculateUnrealizedPnL(trade, currentPrice);

  return {
    tradeId: trade.id,
    pair: trade.pair,
    currentPrice,
    unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
    unrealizedPnLPercentage: Math.round(
      ((unrealizedPnL / (trade.entryPrice * trade.positionSize)) * 100) * 100
    ) / 100,
    alerts,
    monitoring: {
      distanceToStopLoss: calculateDistance(trade, currentPrice, "stopLoss"),
      distanceToTakeProfit: calculateDistance(trade, currentPrice, "takeProfit"),
      timeOpenMinutes: calculateTimeOpen(trade),
    },
    lastCheckedAt: new Date().toISOString(),
  };
};

/**
 * Check if stop loss or take profit is hit
 * @param {Object} trade - Trade object
 * @param {number} currentPrice - Current price
 * @returns {Object} - Check result
 */
export const checkStopLevels = (trade, currentPrice) => {
  const { signal, stopLossPrice, takeProfitPrice } = trade;
  let hitLevel = null;

  if (signal === "BUY") {
    if (currentPrice <= stopLossPrice) {
      hitLevel = "stop_loss";
    } else if (takeProfitPrice && currentPrice >= takeProfitPrice) {
      hitLevel = "take_profit";
    }
  } else if (signal === "SELL") {
    if (currentPrice >= stopLossPrice) {
      hitLevel = "stop_loss";
    } else if (takeProfitPrice && currentPrice <= takeProfitPrice) {
      hitLevel = "take_profit";
    }
  }

  return { hitLevel, currentPrice };
};

/**
 * Check for volatility spikes
 * @param {Object} trade - Trade object
 * @param {Object} marketData - Market data with high/low
 * @returns {Object|null} - Alert object or null
 */
export const checkVolatility = (trade, marketData) => {
  if (!marketData.high || !marketData.low) return null;

  const volatility = ((marketData.high - marketData.low) / marketData.low) * 100;
  const threshold = 5; // 5% volatility threshold

  if (volatility > threshold) {
    return {
      type: "high_volatility",
      message: `High volatility detected: ${volatility.toFixed(2)}%`,
      severity: "warning",
      volatility: Math.round(volatility * 100) / 100,
    };
  }

  return null;
};

/**
 * Check distance to stop loss / take profit
 * @param {Object} trade - Trade object
 * @param {number} currentPrice - Current price
 * @returns {Object|null} - Alert object or null
 */
export const checkDistanceToLevels = (trade, currentPrice) => {
  const { signal, stopLossPrice, takeProfitPrice } = trade;
  const dangerZone = 0.5; // % within stop loss

  if (signal === "BUY") {
    const distanceToSL = ((currentPrice - stopLossPrice) / stopLossPrice) * 100;

    if (distanceToSL > 0 && distanceToSL < dangerZone) {
      return {
        type: "approaching_stop_loss",
        message: `Price ${distanceToSL.toFixed(2)}% away from stop loss`,
        severity: "high",
        distance: Math.round(distanceToSL * 100) / 100,
      };
    }
  } else if (signal === "SELL") {
    const distanceToSL = ((stopLossPrice - currentPrice) / stopLossPrice) * 100;

    if (distanceToSL > 0 && distanceToSL < dangerZone) {
      return {
        type: "approaching_stop_loss",
        message: `Price ${distanceToSL.toFixed(2)}% away from stop loss`,
        severity: "high",
        distance: Math.round(distanceToSL * 100) / 100,
      };
    }
  }

  return null;
};

/**
 * Calculate unrealized P&L
 * @param {Object} trade - Trade object
 * @param {number} currentPrice - Current market price
 * @returns {number} - Unrealized P&L
 */
export const calculateUnrealizedPnL = (trade, currentPrice) => {
  const executionPrice = trade.executionPrice || trade.entryPrice;

  if (trade.signal === "BUY") {
    return (currentPrice - executionPrice) * trade.positionSize;
  } else {
    return (executionPrice - currentPrice) * trade.positionSize;
  }
};

/**
 * Calculate distance to stop loss or take profit
 * @param {Object} trade - Trade object
 * @param {number} currentPrice - Current price
 * @param {string} level - "stopLoss" or "takeProfit"
 * @returns {number} - Distance in price or null
 */
export const calculateDistance = (trade, currentPrice, level) => {
  const targetPrice =
    level === "stopLoss" ? trade.stopLossPrice : trade.takeProfitPrice;

  if (!targetPrice) return null;

  return Math.abs(currentPrice - targetPrice);
};

/**
 * Calculate time a trade has been open
 * @param {Object} trade - Trade object
 * @returns {number} - Minutes open
 */
export const calculateTimeOpen = (trade) => {
  const openTime = new Date(trade.executedAt || trade.createdAt);
  const now = new Date();
  return Math.floor((now - openTime) / (1000 * 60));
};

/**
 * Generate monitoring dashboard data
 * @param {Array<Object>} trades - Array of open trades
 * @param {Object} marketDataMap - Map of pair to market data
 * @returns {Object} - Consolidated monitoring data
 */
export const generateMonitoringDashboard = (trades = [], marketDataMap = {}) => {
  const monitoringData = [];
  let totalUnrealizedPnL = 0;
  let criticalAlerts = [];

  trades.forEach((trade) => {
    const marketData = marketDataMap[trade.pair];

    if (marketData) {
      const monitoring = monitorTrade(trade, marketData);
      monitoringData.push(monitoring);

      totalUnrealizedPnL += monitoring.unrealizedPnL;

      // Collect critical alerts
      if (monitoring.alerts.length > 0) {
        criticalAlerts = [
          ...criticalAlerts,
          ...monitoring.alerts.filter((a) => a.severity === "critical"),
        ];
      }
    }
  });

  return {
    totalTrades: trades.length,
    totalUnrealizedPnL: Math.round(totalUnrealizedPnL * 100) / 100,
    criticalAlerts,
    monitoringData,
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Check trade health
 * @param {Object} trade - Trade object
 * @param {number} currentPrice - Current price
 * @returns {Object} - Trade health assessment
 */
export const assessTradeHealth = (trade, currentPrice) => {
  const unrealizedPnL = calculateUnrealizedPnL(trade, currentPrice);
  const unrealizedPnLPct = (unrealizedPnL / (trade.entryPrice * trade.positionSize)) * 100;

  let healthStatus = "healthy";
  let healthReason = "";

  if (unrealizedPnLPct < -2) {
    healthStatus = "at_risk";
    healthReason = `Position is down ${Math.abs(unrealizedPnLPct).toFixed(2)}%`;
  } else if (unrealizedPnLPct < -5) {
    healthStatus = "critical";
    healthReason = `Position is down ${Math.abs(unrealizedPnLPct).toFixed(2)}% - consider closing`;
  } else if (unrealizedPnLPct > 5) {
    healthStatus = "profitable";
    healthReason = `Position is up ${unrealizedPnLPct.toFixed(2)}%`;
  }

  return {
    status: healthStatus,
    reason: healthReason,
    unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
    unrealizedPnLPercentage: Math.round(unrealizedPnLPct * 100) / 100,
  };
};

/**
 * Create monitoring alert
 * @param {string} type - Alert type
 * @param {string} message - Alert message
 * @param {string} severity - "info", "warning", "high", "critical"
 * @param {string} tradeId - Associated trade ID
 * @returns {Object} - Alert object
 */
export const createMonitoringAlert = (type, message, severity, tradeId) => {
  return {
    id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    severity,
    tradeId,
    createdAt: new Date().toISOString(),
    read: false,
  };
};

/**
 * Batch monitoring - monitor multiple trades efficiently
 * @param {Array<Object>} trades - Trades to monitor
 * @param {Object} priceData - Current prices map { pair: price }
 * @returns {Array<Object>} - Monitoring results
 */
export const batchMonitorTrades = (trades = [], priceData = {}) => {
  return trades
    .filter((trade) => priceData[trade.pair])
    .map((trade) =>
      monitorTrade(trade, {
        currentPrice: priceData[trade.pair],
      })
    );
};
