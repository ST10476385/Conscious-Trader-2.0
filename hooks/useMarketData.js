import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import marketDataClient from '@/api/marketDataClient';
import newsClient from '@/api/newsClient';

/**
 * Hook to fetch real-time price data
 */
export const useMarketPrice = (pair, refetchInterval = 5000) => {
  return useQuery({
    queryKey: ['marketPrice', pair],
    queryFn: () => marketDataClient.getCurrentPrice(pair),
    refetchInterval,
    staleTime: 4000,
  });
};

/**
 * Hook to fetch OHLC data for charts
 */
export const useOHLCData = (pair, interval = '1h', limit = 100) => {
  return useQuery({
    queryKey: ['ohlcData', pair, interval],
    queryFn: () => marketDataClient.getOHLCData(pair, interval, limit),
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 60000,
  });
};

/**
 * Hook to fetch multiple pairs at once
 */
export const useMultiplePairs = (pairs = ['EUR/USD', 'GBP/USD', 'BTC/USD'], refetchInterval = 5000) => {
  return useQuery({
    queryKey: ['multiplePairs', pairs.join(',')],
    queryFn: () => marketDataClient.getMultiplePairsData(pairs),
    refetchInterval,
    staleTime: 4000,
  });
};

/**
 * Hook for real-time WebSocket price updates
 */
export const usePriceSubscription = (pair) => {
  const [price, setPrice] = useState(null);
  const [timestamp, setTimestamp] = useState(null);

  useEffect(() => {
    const unsubscribe = marketDataClient.subscribeToPriceUpdates(pair, (data) => {
      setPrice(data.price);
      setTimestamp(data.timestamp);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [pair]);

  return { price, timestamp };
};

/**
 * Hook to fetch crypto prices and market cap
 */
export const useCryptoPrices = (cryptoIds = ['bitcoin', 'ethereum'], refetchInterval = 10000) => {
  return useQuery({
    queryKey: ['cryptoPrices', cryptoIds.join(',')],
    queryFn: () => marketDataClient.getCryptoPrices(cryptoIds),
    refetchInterval,
    staleTime: 9000,
  });
};

/**
 * Hook to fetch crypto historical data
 */
export const useCryptoHistory = (cryptoId = 'bitcoin', days = 30) => {
  return useQuery({
    queryKey: ['cryptoHistory', cryptoId, days],
    queryFn: () => marketDataClient.getCryptoHistory(cryptoId, days),
    staleTime: 3600000, // Cache for 1 hour
  });
};

/**
 * Hook to fetch financial news
 */
export const useFinancialNews = (keywords = 'trading', limit = 20) => {
  return useQuery({
    queryKey: ['financialNews', keywords],
    queryFn: () => newsClient.getFinancialNews(keywords, limit),
    staleTime: 600000, // Cache for 10 minutes
    refetchInterval: 600000,
  });
};

/**
 * Hook to fetch crypto news
 */
export const useCryptoNews = (limit = 20) => {
  return useQuery({
    queryKey: ['cryptoNews'],
    queryFn: () => newsClient.getCryptoNews(limit),
    staleTime: 600000,
    refetchInterval: 600000,
  });
};

/**
 * Hook to fetch market-specific news
 */
export const useMarketNews = (pair, limit = 15) => {
  return useQuery({
    queryKey: ['marketNews', pair],
    queryFn: () => newsClient.getMarketNews(pair, limit),
    staleTime: 600000,
    refetchInterval: 600000,
  });
};

/**
 * Hook to fetch trending news
 */
export const useTrendingNews = (limit = 10) => {
  return useQuery({
    queryKey: ['trendingNews'],
    queryFn: () => newsClient.getTrendingNews(limit),
    staleTime: 600000,
    refetchInterval: 600000,
  });
};

/**
 * Hook to search news with multiple filters
 */
export const useNewsSearch = (options = {}) => {
  const queryKey = ['newsSearch', JSON.stringify(options)];
  
  return useQuery({
    queryKey,
    queryFn: () => newsClient.searchNews(options),
    staleTime: 600000,
    enabled: !!options.query, // Only run if query is provided
  });
};

/**
 * Hook combining price and news for a specific pair
 */
export const useMarketData = (pair, interval = '1h') => {
  const priceQuery = useMarketPrice(pair);
  const ohlcQuery = useOHLCData(pair, interval);
  const newsQuery = useMarketNews(pair, 10);

  return {
    price: priceQuery.data,
    priceLoading: priceQuery.isLoading,
    priceError: priceQuery.error,
    
    ohlcData: ohlcQuery.data,
    ohlcLoading: ohlcQuery.isLoading,
    ohlcError: ohlcQuery.error,
    
    news: newsQuery.data,
    newsLoading: newsQuery.isLoading,
    newsError: newsQuery.error,
    
    isLoading: priceQuery.isLoading || ohlcQuery.isLoading || newsQuery.isLoading,
    error: priceQuery.error || ohlcQuery.error || newsQuery.error,
  };
};

/**
 * Hook to fetch Finnhub news for a symbol
 */
export const useFinnhubNews = (symbol, limit = 20) => {
  return useQuery({
    queryKey: ['finnhubNews', symbol],
    queryFn: () => marketDataClient.getFinnhubNews(symbol, limit),
    staleTime: 600000, // Cache for 10 minutes
    refetchInterval: 600000,
    enabled: !!symbol,
  });
};

/**
 * Hook to fetch market sentiment from Finnhub
 */
export const useFinnhubSentiment = (symbol) => {
  return useQuery({
    queryKey: ['finnhubSentiment', symbol],
    queryFn: () => marketDataClient.getFinnhubSentiment(symbol),
    staleTime: 300000, // Cache for 5 minutes
    refetchInterval: 300000,
    enabled: !!symbol,
  });
};

/**
 * Combined hook for Finnhub data (news + sentiment)
 */
export const useFinnhubMarketData = (symbol, newsLimit = 20) => {
  const newsQuery = useFinnhubNews(symbol, newsLimit);
  const sentimentQuery = useFinnhubSentiment(symbol);

  return {
    news: newsQuery.data,
    newsLoading: newsQuery.isLoading,
    newsError: newsQuery.error,
    
    sentiment: sentimentQuery.data,
    sentimentLoading: sentimentQuery.isLoading,
    sentimentError: sentimentQuery.error,
    
    isLoading: newsQuery.isLoading || sentimentQuery.isLoading,
    error: newsQuery.error || sentimentQuery.error,
  };
};

export default {
  useMarketPrice,
  useOHLCData,
  useMultiplePairs,
  usePriceSubscription,
  useCryptoPrices,
  useCryptoHistory,
  useFinancialNews,
  useCryptoNews,
  useMarketNews,
  useTrendingNews,
  useNewsSearch,
  useMarketData,
  useFinnhubNews,
  useFinnhubSentiment,
  useFinnhubMarketData,
};
