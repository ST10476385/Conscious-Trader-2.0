import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backendClient from '@/api/backendClient';

/**
 * Fetch all trades for user
 */
export const useGetTrades = () => {
  return useQuery({
    queryKey: ['trades'],
    queryFn: () => backendClient.trades.getAllTrades(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};

/**
 * Fetch open trades only
 */
export const useGetOpenTrades = () => {
  return useQuery({
    queryKey: ['trades', 'open'],
    queryFn: () => backendClient.trades.getOpenTrades(),
    staleTime: 30000,
    refetchInterval: 30000, // More frequent for open trades
  });
};

/**
 * Fetch closed trades
 */
export const useGetClosedTrades = () => {
  return useQuery({
    queryKey: ['trades', 'closed'],
    queryFn: () => backendClient.trades.getClosedTrades(),
    staleTime: 60000,
  });
};

/**
 * Create new trade
 */
export const useCreateTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tradeData) => backendClient.trades.createTrade(tradeData),
    onSuccess: () => {
      // Invalidate trades queries to refetch
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};

/**
 * Approve trade
 */
export const useApproveTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId, notes }) => 
      backendClient.trades.approveTrade(tradeId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};

/**
 * Reject trade
 */
export const useRejectTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId, reason }) => 
      backendClient.trades.rejectTrade(tradeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
  });
};

/**
 * Execute trade
 */
export const useExecuteTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId, notes }) => 
      backendClient.trades.executeTrade(tradeId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', 'open'] });
      queryClient.invalidateQueries({ queryKey: ['performance'] });
    },
  });
};

/**
 * Close trade
 */
export const useCloseTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tradeId, exitPrice }) => 
      backendClient.trades.closeTrade(tradeId, exitPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['trades', 'closed'] });
      queryClient.invalidateQueries({ queryKey: ['performance'] });
    },
  });
};

/**
 * Single trade fetcher (if needed)
 */
export const useGetTrade = (tradeId) => {
  return useQuery({
    queryKey: ['trade', tradeId],
    queryFn: () => backendClient.trades.getTrade(tradeId),
    enabled: !!tradeId,
    staleTime: 30000,
  });
};

export default {
  useGetTrades,
  useGetOpenTrades,
  useGetClosedTrades,
  useCreateTrade,
  useApproveTrade,
  useRejectTrade,
  useExecuteTrade,
  useCloseTrade,
  useGetTrade,
};
