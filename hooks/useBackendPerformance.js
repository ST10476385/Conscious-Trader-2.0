import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backendClient from '@/api/backendClient';

/**
 * Fetch account balance
 */
export const useGetBalance = () => {
  return useQuery({
    queryKey: ['performance', 'balance'],
    queryFn: () => backendClient.performance.getBalance(),
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });
};

/**
 * Fetch daily P&L
 */
export const useGetDailyPnL = () => {
  return useQuery({
    queryKey: ['performance', 'dailyPnL'],
    queryFn: () => backendClient.performance.getDailyPnL(),
    staleTime: 30000,
    refetchInterval: 60000, // 1 minute (updated frequently)
  });
};

/**
 * Fetch performance statistics
 */
export const useGetStats = () => {
  return useQuery({
    queryKey: ['performance', 'stats'],
    queryFn: () => backendClient.performance.getStats(),
    staleTime: 60000,
    refetchInterval: 300000, // 5 minutes
  });
};

/**
 * Fetch open positions
 */
export const useGetPositions = () => {
  return useQuery({
    queryKey: ['performance', 'positions'],
    queryFn: () => backendClient.performance.getPositions(),
    staleTime: 30000,
    refetchInterval: 60000, // 1 minute
  });
};

/**
 * Fetch risk metrics
 */
export const useGetRiskMetrics = () => {
  return useQuery({
    queryKey: ['performance', 'riskMetrics'],
    queryFn: () => backendClient.performance.getRiskMetrics(),
    staleTime: 30000,
    refetchInterval: 60000, // 1 minute
  });
};

/**
 * Update risk settings
 */
export const useUpdateRiskSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dailyLossLimit, maxPositionSize, maxRiskPerTrade }) =>
      backendClient.performance.updateRiskSettings(
        dailyLossLimit,
        maxPositionSize,
        maxRiskPerTrade
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'riskMetrics'] });
    },
  });
};

/**
 * Fetch all performance data at once
 */
export const useGetAllPerformanceData = () => {
  const balance = useGetBalance();
  const dailyPnL = useGetDailyPnL();
  const stats = useGetStats();
  const positions = useGetPositions();
  const riskMetrics = useGetRiskMetrics();

  return {
    balance: balance.data,
    dailyPnL: dailyPnL.data,
    stats: stats.data,
    positions: positions.data,
    riskMetrics: riskMetrics.data,
    isLoading:
      balance.isLoading ||
      dailyPnL.isLoading ||
      stats.isLoading ||
      positions.isLoading ||
      riskMetrics.isLoading,
    error:
      balance.error ||
      dailyPnL.error ||
      stats.error ||
      positions.error ||
      riskMetrics.error,
  };
};

export default {
  useGetBalance,
  useGetDailyPnL,
  useGetStats,
  useGetPositions,
  useGetRiskMetrics,
  useUpdateRiskSettings,
  useGetAllPerformanceData,
};
