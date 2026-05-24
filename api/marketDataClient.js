/**
 * Market Data API Client
 * Real-time market data from multiple sources:
 * - Finnhub API (stocks, forex, crypto - requires API key)
 * - Binance API (crypto data - free, no key needed)
 * - Alpha Vantage API (forex, stocks - free tier with key)
 * - CoinGecko API (crypto data - free, no key needed)
 */

const FINNHUB_API = 'https://finnhub.io/api/v1';
const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo';

const BINANCE_API = 'https://api.binance.com/api/v3';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo'; // Get from .env

/**
 * Get current price for a trading pair
 * Supports: EUR/USD, GBP/USD, BTC/USD, ETH/USD, AAPL, MSFT, etc.
 * Priority: Finnhub (PRIMARY) → Alpha Vantage (BACKUP) → Other sources (FALLBACK)
 */
export const getCurrentPrice = async (pair) => {
  try {
    // 1. PRIMARY: Try Finnhub first (best data quality)
    if (FINNHUB_KEY !== 'demo') {
      const finnhubPrice = await getFinnhubPrice(pair);
      if (finnhubPrice) return finnhubPrice;
    }

    // 2. BACKUP: Use Alpha Vantage for forex and stocks
    if (pair.includes('EUR')) {
      const alphaPrice = await getAlphaVantagePrice('EUR', 'USD');
      if (alphaPrice) return alphaPrice;
    } else if (pair.includes('GBP')) {
      const alphaPrice = await getAlphaVantagePrice('GBP', 'USD');
      if (alphaPrice) return alphaPrice;
    } else if (pair.includes('JPY')) {
      const alphaPrice = await getAlphaVantagePrice('JPY', 'USD');
      if (alphaPrice) return alphaPrice;
    }

    // 3. FALLBACK: Use Binance for crypto if other sources fail
    if (pair.includes('BTC')) {
      return await getBinancePrice('BTCUSDT');
    } else if (pair.includes('ETH')) {
      return await getBinancePrice('ETHUSDT');
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching price for ${pair}:`, error);
    return null;
  }
};

/**
 * Get OHLC (Open, High, Low, Close) data for technical analysis
 * Priority: Finnhub (PRIMARY) → Alpha Vantage (BACKUP for forex) → Binance (FALLBACK for crypto)
 */
export const getOHLCData = async (pair, interval = '1h', limit = 100) => {
  try {
    // 1. PRIMARY: Try Finnhub first
    if (FINNHUB_KEY !== 'demo') {
      const finnhubOHLC = await getFinnhubOHLC(pair, interval);
      if (finnhubOHLC && finnhubOHLC.length > 0) {
        return finnhubOHLC.slice(0, limit);
      }
    }

    // 2. For forex pairs, try Alpha Vantage as backup
    if (pair.includes('EUR') || pair.includes('GBP') || pair.includes('JPY')) {
      const alphaOHLC = await getAlphaVantageOHLC(pair, interval);
      if (alphaOHLC && alphaOHLC.length > 0) {
        return alphaOHLC.slice(0, limit);
      }
    }

    // 3. FALLBACK: For crypto, use Binance
    if (pair.includes('BTC') || pair.includes('ETH')) {
      return await getBinanceOHLC(pair, interval, limit);
    }

    return [];
  } catch (error) {
    console.error(`Error fetching OHLC data for ${pair}:`, error);
    return [];
  }
};

/**
 * Get multiple pairs data at once (for dashboard)
 */
export const getMultiplePairsData = async (pairs) => {
  try {
    const promises = pairs.map(pair => getCurrentPrice(pair));
    const results = await Promise.all(promises);
    
    return pairs.reduce((acc, pair, index) => {
      acc[pair] = {
        price: results[index],
        timestamp: new Date(),
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching multiple pairs:', error);
    return {};
  }
};

/**
 * Subscribe to real-time price updates (WebSocket)
 */
export const subscribeToPriceUpdates = (pair, callback) => {
  try {
    if (pair.includes('BTC')) {
      const symbol = 'btcusdt';
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback({
          pair: pair.toUpperCase(),
          price: parseFloat(data.p),
          timestamp: new Date(data.T),
          volume: parseFloat(data.q),
        });
      };
      
      ws.onerror = (error) => {
        console.error(`WebSocket error for ${pair}:`, error);
      };
      
      return () => ws.close();
    }
  } catch (error) {
    console.error('Error subscribing to price updates:', error);
  }
};

// ==================== BINANCE FUNCTIONS ====================

/**
 * Get current price from Binance
 */
async function getBinancePrice(symbol) {
  try {
    const response = await fetch(`${BINANCE_API}/ticker/price?symbol=${symbol}`);
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Binance price error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get OHLC data from Binance
 * Intervals: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M
 */
async function getBinanceOHLC(pair, interval = '1h', limit = 100) {
  try {
    let symbol;
    if (pair.includes('BTC')) symbol = 'BTCUSDT';
    else if (pair.includes('ETH')) symbol = 'ETHUSDT';
    else return [];

    const response = await fetch(
      `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    const data = await response.json();

    return data.map(candle => ({
      timestamp: new Date(candle[0]),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[7]),
    }));
  } catch (error) {
    console.error(`Binance OHLC error for ${pair}:`, error);
    return [];
  }
}

// ==================== ALPHA VANTAGE FUNCTIONS ====================

/**
 * Get forex price from Alpha Vantage
 */
async function getAlphaVantagePrice(fromCurrency, toCurrency) {
  try {
    const response = await fetch(
      `${ALPHA_VANTAGE_API}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    const data = await response.json();
    
    if (data['Realtime Currency Exchange Rate']) {
      return parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
    }
    return null;
  } catch (error) {
    console.error(`Alpha Vantage price error for ${fromCurrency}/${toCurrency}:`, error);
    return null;
  }
}

/**
 * Get intraday OHLC from Alpha Vantage
 */
async function getAlphaVantageOHLC(pair, interval = '60min') {
  try {
    const symbols = pair.split('/');
    let alphaInterval = interval;
    if (interval === '1h') alphaInterval = '60min';
    if (interval === '4h') alphaInterval = '60min';
    if (interval === '1d' || interval === '1D') alphaInterval = '60min';

    const response = await fetch(
      `${ALPHA_VANTAGE_API}?function=FX_INTRADAY&from_symbol=${symbols[0]}&to_symbol=${symbols[1]}&interval=${alphaInterval}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    const data = await response.json();

    const timeSeries = data['Time Series (60min)'] || data['Time Series (1min)'] || data['Time Series (15min)'] || data['Time Series (30min)'] || {};
    
    return Object.entries(timeSeries).slice(0, 100).map(([timestamp, candle]) => ({
      timestamp: new Date(timestamp),
      open: parseFloat(candle['1. open']),
      high: parseFloat(candle['2. high']),
      low: parseFloat(candle['3. low']),
      close: parseFloat(candle['4. close']),
      volume: 0,
    }));
  } catch (error) {
    console.error(`Alpha Vantage OHLC error for ${pair}:`, error);
    return [];
  }
}

// ==================== COINGECKO FUNCTIONS ====================

/**
 * Get crypto price from CoinGecko (free, no key needed)
 */
export const getCryptoPrices = async (cryptoIds = ['bitcoin', 'ethereum']) => {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('CoinGecko error:', error);
    return {};
  }
};

/**
 * Get historical crypto data
 */
export const getCryptoHistory = async (cryptoId = 'bitcoin', days = 30) => {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`
    );
    const data = await response.json();
    
    return data.prices.map(([timestamp, price]) => ({
      timestamp: new Date(timestamp),
      price,
    }));
  } catch (error) {
    console.error(`CoinGecko history error for ${cryptoId}:`, error);
    return [];
  }
};

// ==================== FINNHUB FUNCTIONS ====================

/**
 * Get current stock/forex price from Finnhub
 * Supports: Stock symbols (AAPL, MSFT, GOOGL), Forex pairs (EURUSD, GBPUSD), Crypto (BTCUSD, ETHUSD)
 */
async function getFinnhubPrice(pair) {
  try {
    if (FINNHUB_KEY === 'demo') return null;

    let symbol;
    if (pair.includes('BTC')) symbol = 'BTCUSD';
    else if (pair.includes('ETH')) symbol = 'ETHUSD';
    else if (pair.includes('EUR')) symbol = 'EURUSD';
    else if (pair.includes('GBP')) symbol = 'GBPUSD';
    else if (pair.includes('JPY')) symbol = 'JPYUSD';
    else symbol = pair.replace('/', '');

    const response = await fetch(
      `${FINNHUB_API}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`
    );
    const data = await response.json();

    if (data.c) {
      return parseFloat(data.c); // Current price
    }
    return null;
  } catch (error) {
    console.error(`Finnhub price error for ${pair}:`, error);
    return null;
  }
}

/**
 * Get intraday OHLC data from Finnhub
 */
async function getFinnhubOHLC(pair, interval = '1') {
  try {
    if (FINNHUB_KEY === 'demo') return [];

    let symbol;
    if (pair.includes('BTC')) symbol = 'BTCUSD';
    else if (pair.includes('ETH')) symbol = 'ETHUSD';
    else if (pair.includes('EUR')) symbol = 'EURUSD';
    else if (pair.includes('GBP')) symbol = 'GBPUSD';
    else symbol = pair.replace('/', '');

    // Finnhub resolution: 1, 5, 15, 30, 60, D, W, M
    let resolution = '60'; // Default 1 hour
    if (interval.includes('5m')) resolution = '5';
    else if (interval.includes('15m')) resolution = '15';
    else if (interval.includes('30m')) resolution = '30';
    else if (interval.includes('1h')) resolution = '60';
    else if (interval.includes('1d') || interval.includes('1D')) resolution = 'D';

    const now = Math.floor(Date.now() / 1000);
    const from = now - 3600 * 100; // 100 hours back

    const response = await fetch(
      `${FINNHUB_API}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${FINNHUB_KEY}`
    );
    const data = await response.json();

    if (data.c && data.c.length > 0) {
      return data.c.map((close, i) => ({
        timestamp: new Date(data.t[i] * 1000),
        open: parseFloat(data.o[i]),
        high: parseFloat(data.h[i]),
        low: parseFloat(data.l[i]),
        close: parseFloat(close),
        volume: data.v ? data.v[i] : 0,
      }));
    }
    return [];
  } catch (error) {
    console.error(`Finnhub OHLC error for ${pair}:`, error);
    return [];
  }
}

/**
 * Get stock/forex news from Finnhub
 */
export const getFinnhubNews = async (symbol = '', limit = 20) => {
  try {
    if (FINNHUB_KEY === 'demo') return [];

    const response = await fetch(
      `${FINNHUB_API}/company-news?symbol=${symbol}&from=${new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&limit=${limit}&token=${FINNHUB_KEY}`
    );
    const data = await response.json();

    return (data || []).map(news => ({
      id: news.id,
      title: news.headline,
      description: news.summary,
      url: news.url,
      source: news.source,
      image: news.image,
      publishedAt: new Date(news.datetime * 1000),
      sentiment: analyzeSentiment(news.headline),
    }));
  } catch (error) {
    console.error('Finnhub news error:', error);
    return [];
  }
};

/**
 * Get market sentiment from Finnhub
 */
export const getFinnhubSentiment = async (symbol) => {
  try {
    if (FINNHUB_KEY === 'demo') return null;

    const response = await fetch(
      `${FINNHUB_API}/news-sentiment?symbol=${symbol}&token=${FINNHUB_KEY}`
    );
    const data = await response.json();

    return {
      symbol,
      sentiment: data.sentiment || 'neutral',
      bullishPercent: data.bullishPercent || 0.5,
      bearishPercent: data.bearishPercent || 0.5,
    };
  } catch (error) {
    console.error(`Finnhub sentiment error for ${symbol}:`, error);
    return null;
  }
};

/**
 * Simple sentiment analysis helper
 */
function analyzeSentiment(text) {
  if (!text) return 'neutral';
  const positiveWords = ['surge', 'bull', 'gain', 'profit', 'rally', 'growth', 'up', 'boost', 'rise', 'jump', 'strong', 'best'];
  const negativeWords = ['crash', 'bear', 'loss', 'decline', 'fall', 'slump', 'down', 'drop', 'weak', 'worst', 'risk', 'threat'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export default {
  getCurrentPrice,
  getOHLCData,
  getMultiplePairsData,
  subscribeToPriceUpdates,
  getCryptoPrices,
  getCryptoHistory,
  getFinnhubNews,
  getFinnhubSentiment,
};
