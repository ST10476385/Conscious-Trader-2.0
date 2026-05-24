/**
 * Custom React hooks for trading services integration
 */

import { useState, useCallback, useEffect } from "react";
import { generateTradeSignal, analyzeMarketCondition } from "@/services/tradeAnalysisEngine";
import {
  calculatePositionSize,
  calculateTakeProfit,
  calculateStopLoss,
  getRiskMetrics,
} from "@/services/riskManagementService";
import {
  approveTrade,
  rejectTrade,
  executeTrade,
  closeTrade,
  createTradeForApproval,
  TRADE_STATES,
} from "@/services/tradeExecutionService";
import { monitorTrade, assessTradeHealth } from "@/services/tradeMonitoringService";

/**
 * Hook for managing trade analysis
 * @param {Object} ohlcData - Market OHLC data
 * @param {Object} config - Analysis config
 * @returns {Object} - Analysis result and loading state
 */
export const useTradeAnalysis = (ohlcData, config = {}) => {
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      if (!ohlcData || !ohlcData.closes) {
        throw new Error("Invalid OHLC data");
      }

      const result = generateTradeSignal(ohlcData, config);
      const marketCondition = analyzeMarketCondition(ohlcData);

      setSignal({
        ...result,
        marketCondition,
      });
    } catch (err) {
      setError(err.message);
      setSignal(null);
    } finally {
      setLoading(false);
    }
  }, [ohlcData, config]);

  return { signal, loading, error, analyze };
};

/**
 * Hook for managing risk calculations
 * @param {Object} tradeParams - Trade parameters
 * @returns {Object} - Risk metrics
 */
export const useRiskCalculation = (tradeParams) => {
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (tradeParams.accountBalance && tradeParams.entryPrice) {
        const metrics = getRiskMetrics(tradeParams);
        setRiskMetrics(metrics);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      setRiskMetrics(null);
    }
  }, [tradeParams]);

  return { riskMetrics, error };
};

/**
 * Hook for managing trade approval workflow
 * @returns {Object} - Trade state and actions
 */
export const useTradeApprovalWorkflow = () => {
  const [pendingTrades, setPendingTrades] = useState([]);
  const [approvedTrades, setApprovedTrades] = useState([]);
  const [rejectedTrades, setRejectedTrades] = useState([]);

  const addPendingTrade = useCallback((signalData) => {
    try {
      const trade = createTradeForApproval(signalData);
      setPendingTrades((prev) => [trade, ...prev]);
      return trade;
    } catch (err) {
      console.error("Error creating trade:", err);
      return null;
    }
  }, []);

  const approvePendingTrade = useCallback((tradeId, notes = "") => {
    setPendingTrades((prev) => {
      const trade = prev.find((t) => t.id === tradeId);
      if (!trade) return prev;

      const approved = approveTrade(trade, notes);
      setApprovedTrades((approved_trades) => [approved, ...approved_trades]);
      return prev.filter((t) => t.id !== tradeId);
    });
  }, []);

  const rejectPendingTrade = useCallback((tradeId, reason = "") => {
    setPendingTrades((prev) => {
      const trade = prev.find((t) => t.id === tradeId);
      if (!trade) return prev;

      const rejected = rejectTrade(trade, reason);
      setRejectedTrades((rejected_trades) => [rejected, ...rejected_trades]);
      return prev.filter((t) => t.id !== tradeId);
    });
  }, []);

  return {
    pendingTrades,
    approvedTrades,
    rejectedTrades,
    addPendingTrade,
    approvePendingTrade,
    rejectPendingTrade,
  };
};

/**
 * Hook for managing open trades and execution
 * @returns {Object} - Trades and actions
 */
export const useTradeExecution = () => {
  const [openTrades, setOpenTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [executionErrors, setExecutionErrors] = useState([]);

  const executePendingTrade = useCallback((trade, executionPrice) => {
    try {
      const executed = executeTrade(trade, executionPrice);
      setOpenTrades((prev) => [executed, ...prev]);
      setExecutionErrors((prev) =>
        prev.filter((e) => e.tradeId !== trade.id)
      );
      return executed;
    } catch (err) {
      setExecutionErrors((prev) => [
        ...prev,
        { tradeId: trade.id, error: err.message },
      ]);
      return null;
    }
  }, []);

  const closeOpenTrade = useCallback((tradeId, closingPrice, reason = "manual") => {
    setOpenTrades((prev) => {
      const trade = prev.find((t) => t.id === tradeId);
      if (!trade) return prev;

      const closed = closeTrade(trade, closingPrice, reason);
      setClosedTrades((closed_trades) => [closed, ...closed_trades]);
      return prev.filter((t) => t.id !== tradeId);
    });
  }, []);

  return {
    openTrades,
    closedTrades,
    executionErrors,
    executePendingTrade,
    closeOpenTrade,
  };
};

/**
 * Hook for monitoring open trades
 * @param {Object} trade - Trade to monitor
 * @param {Object} marketData - Current market data
 * @returns {Object} - Monitoring data and health status
 */
export const useTradeMonitoring = (trade, marketData) => {
  const [monitoring, setMonitoring] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (trade && marketData && marketData.currentPrice) {
      const monitoringData = monitorTrade(trade, marketData);
      const healthData = assessTradeHealth(trade, marketData.currentPrice);

      setMonitoring(monitoringData);
      setHealth(healthData);
    }
  }, [trade, marketData]);

  return { monitoring, health };
};

/**
 * Hook for managing daily risk limits
 * @param {number} accountBalance - Account balance
 * @param {number} dailyLossLimit - Daily loss limit percentage
 * @returns {Object} - Daily limits state and checker
 */
export const useDailyLossLimit = (accountBalance, dailyLossLimit = 2) => {
  const [todayPnL, setTodayPnL] = useState(0);
  const [limitExceeded, setLimitExceeded] = useState(false);

  const updateTodayPnL = useCallback((closedTrades) => {
    const today = new Date().toDateString();
    const todayTrades = closedTrades.filter(
      (t) => new Date(t.closedAt).toDateString() === today
    );

    const pnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const pnlPercentage = (pnl / accountBalance) * 100;

    setTodayPnL(pnl);

    if (pnlPercentage < -dailyLossLimit) {
      setLimitExceeded(true);
    } else {
      setLimitExceeded(false);
    }
  }, [accountBalance, dailyLossLimit]);

  return {
    todayPnL,
    limitExceeded,
    remainingDailyRisk: Math.max(0, (dailyLossLimit / 100) * accountBalance + todayPnL),
    updateTodayPnL,
  };
};

/**
 * Hook for position sizing
 * @param {Object} params - Position sizing parameters
 * @returns {Object} - Position sizing result
 */
export const usePositionSizing = (params) => {
  const [positionSize, setPositionSize] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (params.accountBalance && params.entryPrice && params.stopLossPrice) {
        const size = calculatePositionSize(params);
        setPositionSize(size);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      setPositionSize(null);
    }
  }, [params]);

  return { positionSize, error };
};
