/**
 * Trade Analysis Engine
 * Generates trade suggestions based on technical analysis
 */

/**
 * Calculate Simple Moving Average (SMA)
 * @param {Array<number>} prices - Array of prices
 * @param {number} period - Period for SMA calculation
 * @returns {number} - SMA value
 */
export const calculateSMA = (prices, period) => {
  if (!prices || prices.length < period) return null;
  
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, price) => acc + price, 0);
  return sum / period;
};

/**
 * Calculate RSI (Relative Strength Index)
 * @param {Array<number>} prices - Array of closing prices
 * @param {number} period - Period (typically 14)
 * @returns {number} - RSI value (0-100)
 */
export const calculateRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) return null;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {Array<number>} prices - Array of closing prices
 * @returns {Object} - MACD line, signal line, histogram
 */
export const calculateMACD = (prices) => {
  if (!prices || prices.length < 26) return null;

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  const macdLine = ema12 - ema26;
  const signalLine = calculateSMA([macdLine], 9) || macdLine;
  const histogram = macdLine - signalLine;

  return {
    macdLine,
    signalLine,
    histogram,
  };
};

/**
 * Calculate EMA (Exponential Moving Average)
 * @param {Array<number>} prices - Array of prices
 * @param {number} period - Period
 * @returns {number} - EMA value
 */
export const calculateEMA = (prices, period) => {
  if (!prices || prices.length < period) return null;

  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
};

/**
 * Calculate Bollinger Bands
 * @param {Array<number>} prices - Array of prices
 * @param {number} period - Period (typically 20)
 * @param {number} deviation - Standard deviation (typically 2)
 * @returns {Object} - Upper band, middle band, lower band
 */
export const calculateBollingerBands = (prices, period = 20, deviation = 2) => {
  if (!prices || prices.length < period) return null;

  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  
  const variance =
    slice.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: sma + deviation * stdDev,
    middle: sma,
    lower: sma - deviation * stdDev,
  };
};

/**
 * Generate trade signal based on multiple indicators
 * @param {Object} ohlcData - OHLC data with prices
 * @param {Object} config - Configuration for analysis
 * @returns {Object} - Trade signal with details
 */
export const generateTradeSignal = (ohlcData, config = {}) => {
  const {
    rsiPeriod = 14,
    smaPeriod = 20,
    bollingerPeriod = 20,
  } = config;

  if (!ohlcData || !ohlcData.closes || ohlcData.closes.length < 26) {
    return null;
  }

  const prices = ohlcData.closes;
  const currentPrice = prices[prices.length - 1];

  // Calculate indicators
  const rsi = calculateRSI(prices, rsiPeriod);
  const sma20 = calculateSMA(prices, smaPeriod);
  const sma50 = calculateSMA(prices, 50);
  const bollinger = calculateBollingerBands(prices, bollingerPeriod);
  const macd = calculateMACD(prices);

  // Initialize score
  let buySignals = 0;
  let sellSignals = 0;
  let confidence = 50;

  // RSI Analysis
  if (rsi < 30) {
    buySignals += 2;
  } else if (rsi > 70) {
    sellSignals += 2;
  }

  // Moving Average Analysis
  if (sma20 && currentPrice > sma20 && sma50 && sma20 > sma50) {
    buySignals += 1.5;
  } else if (sma20 && currentPrice < sma20 && sma50 && sma20 < sma50) {
    sellSignals += 1.5;
  }

  // Bollinger Bands Analysis
  if (bollinger) {
    if (currentPrice < bollinger.lower) {
      buySignals += 1;
    } else if (currentPrice > bollinger.upper) {
      sellSignals += 1;
    }
  }

  // MACD Analysis
  if (macd && macd.histogram > 0) {
    buySignals += 1;
  } else if (macd && macd.histogram < 0) {
    sellSignals += 1;
  }

  // Determine signal
  let signal = "NEUTRAL";
  if (buySignals > sellSignals) {
    signal = "BUY";
    confidence = Math.min(95, 50 + buySignals * 15);
  } else if (sellSignals > buySignals) {
    signal = "SELL";
    confidence = Math.min(95, 50 + sellSignals * 15);
  } else {
    confidence = 50;
  }

  // Determine trend
  let trend = "neutral";
  if (sma20 && sma50) {
    if (sma20 > sma50) {
      trend = "bullish";
    } else if (sma20 < sma50) {
      trend = "bearish";
    }
  }

  return {
    signal,
    confidence: Math.round(confidence),
    trend,
    indicators: {
      rsi: Math.round(rsi * 100) / 100,
      sma20: Math.round(sma20 * 100) / 100,
      sma50: Math.round(sma50 * 100) / 100,
      bollinger,
      macd,
    },
    buySignals: Math.round(buySignals),
    sellSignals: Math.round(sellSignals),
    currentPrice,
    timestamp: new Date().toISOString(),
  };
};

const summarizeNews = (news = []) => {
  const summary = { positive: 0, negative: 0, neutral: 0 };

  (news || []).forEach((item) => {
    const sentiment = String(item?.sentiment || 'neutral').toLowerCase();
    if (sentiment === 'positive') summary.positive += 1;
    else if (sentiment === 'negative') summary.negative += 1;
    else summary.neutral += 1;
  });

  const total = summary.positive + summary.negative + summary.neutral;
  const overall = summary.positive > summary.negative
    ? 'positive'
    : summary.negative > summary.positive
      ? 'negative'
      : 'neutral';

  return { ...summary, total, overall };
};

const scoreTrendEngine = (prices) => {
  if (!prices || prices.length < 50) {
    return { score: 0, label: 'Insufficient price history for trend analysis.' };
  }

  const currentPrice = prices[prices.length - 1];
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, Math.min(200, prices.length));

  if (sma20 && sma50 && sma200 && currentPrice) {
    if (sma20 > sma50 && sma50 > sma200 && currentPrice > sma20) {
      return { score: 2, label: 'Strong uptrend confirmed.' };
    }
    if (sma20 > sma50 && currentPrice > sma20) {
      return { score: 1, label: 'Weak uptrend detected.' };
    }
    if (Math.abs(sma20 - sma50) / sma50 < 0.015) {
      return { score: 0, label: 'Sideways market structure.' };
    }
    if (sma20 < sma50 && sma50 < sma200) {
      return { score: -2, label: 'Downtrend confirmed.' };
    }
  }

  return { score: 0, label: 'Trend is inconclusive.' };
};

const scoreReversalEngine = (prices) => {
  if (!prices || prices.length < 20) {
    return { score: 0, label: 'Not enough data for reversal analysis.' };
  }

  const currentPrice = prices[prices.length - 1];
  const rsi = calculateRSI(prices, 14);
  const bands = calculateBollingerBands(prices, 20);
  const lowerBand = bands?.lower;
  const upperBand = bands?.upper;

  if (rsi !== null && lowerBand && currentPrice <= lowerBand * 1.01 && rsi < 30) {
    return { score: 2, label: 'Oversold bounce setup detected.' };
  }

  if (rsi !== null && lowerBand && currentPrice <= lowerBand * 1.02 && rsi < 40) {
    return { score: 1, label: 'Possible reversal is forming.' };
  }

  if (rsi !== null && upperBand && currentPrice >= upperBand * 0.99 && rsi > 70) {
    return { score: -2, label: 'Strong downtrend continuation / overbought rejection.' };
  }

  return { score: 0, label: 'No reversal signal.' };
};

const scoreNewsSentimentEngine = (news = []) => {
  const summary = summarizeNews(news);

  if (summary.total === 0) {
    return { score: 0, label: 'No news sentiment data available.' };
  }

  if (summary.positive >= summary.negative * 2 && summary.positive >= 2) {
    return { score: 2, label: 'Very positive news sentiment.' };
  }

  if (summary.positive > summary.negative) {
    return { score: 1, label: 'Mild positive news sentiment.' };
  }

  if (summary.negative > summary.positive) {
    return { score: -2, label: 'Negative news sentiment.' };
  }

  return { score: 0, label: 'Neutral news sentiment.' };
};

const scoreVolatilityRiskEngine = (prices) => {
  if (!prices || prices.length < 20) {
    return { score: 0, label: 'Insufficient data for volatility risk.' };
  }

  const volatility = calculateVolatility(prices, 20);

  if (volatility < 0.01) {
    return { score: 1, label: 'Low volatility and lower risk.' };
  }

  if (volatility > 0.03) {
    return { score: -2, label: 'High volatility increases risk.' };
  }

  return { score: 0, label: 'Normal volatility/risk.' };
};

export const generateVerifiedSignal = (pair, ohlcData, news = [], config = {}) => {
  if (!ohlcData) {
    return null;
  }

  let prices = [];
  if (Array.isArray(ohlcData)) {
    prices = ohlcData.map((point) => {
      if (point && typeof point.close === 'number') return point.close;
      return point;
    }).filter((value) => typeof value === 'number');
  } else if (ohlcData.closes && Array.isArray(ohlcData.closes)) {
    prices = ohlcData.closes;
  }

  if (prices.length < 26) {
    return null;
  }

  const currentPrice = prices[prices.length - 1];
  const trendResult = scoreTrendEngine(prices);
  const reversalResult = scoreReversalEngine(prices);
  const newsResult = scoreNewsSentimentEngine(news);
  const riskResult = scoreVolatilityRiskEngine(prices);

  const finalScore = trendResult.score + reversalResult.score + newsResult.score + riskResult.score;
  const signal = finalScore >= 3 ? 'BUY' : finalScore <= -3 ? 'SELL' : 'WAIT';

  const positiveAgreement = [trendResult.score, reversalResult.score, newsResult.score, riskResult.score].filter(
    (score) => score > 0
  ).length;
  const negativeAgreement = [trendResult.score, reversalResult.score, newsResult.score, riskResult.score].filter(
    (score) => score < 0
  ).length;

  let confidence = 0.45;
  if (signal === 'BUY' || signal === 'SELL') {
    const sameDirectionCount = signal === 'BUY' ? positiveAgreement : negativeAgreement;
    const nonZeroCount = [trendResult, reversalResult, newsResult, riskResult].filter((item) => item.score !== 0).length;

    if (sameDirectionCount === nonZeroCount && nonZeroCount > 0) {
      confidence = 0.8;
    } else if (sameDirectionCount >= 2) {
      confidence = 0.65;
    } else {
      confidence = 0.5;
    }
  } else {
    confidence = 0.35 + Math.min(0.15, Math.abs(finalScore) * 0.05);
  }

  const rangeMultiplier = pair.includes('BTC') || pair.includes('ETH') ? 0.015 : 0.01;
  const stopPct = rangeMultiplier * 0.5;
  const targetPct = rangeMultiplier;
  const entry = currentPrice;
  const stop_loss = signal === 'BUY'
    ? currentPrice * (1 - stopPct)
    : signal === 'SELL'
      ? currentPrice * (1 + stopPct)
      : currentPrice;
  const take_profit = signal === 'BUY'
    ? currentPrice * (1 + targetPct)
    : signal === 'SELL'
      ? currentPrice * (1 - targetPct)
      : currentPrice;

  const explanation = [
    `Trend engine: ${trendResult.label} (${trendResult.score >= 0 ? '+' : ''}${trendResult.score}).`,
    `Reversal engine: ${reversalResult.label} (${reversalResult.score >= 0 ? '+' : ''}${reversalResult.score}).`,
    `News sentiment engine: ${newsResult.label} (${newsResult.score >= 0 ? '+' : ''}${newsResult.score}).`,
    `Volatility/risk engine: ${riskResult.label} (${riskResult.score >= 0 ? '+' : ''}${riskResult.score}).`,
    `Final Score: ${finalScore} → ${signal}.`,
  ].join(' ');

  return {
    signal,
    confidence,
    risk_score: Math.min(1, Math.max(0, 0.25 + (finalScore < 0 ? 0.2 : 0) + (riskResult.score < 0 ? 0.2 : 0))),
    trend: trendResult.label,
    entry,
    stop_loss,
    take_profit,
    rsi: calculateRSI(prices, 14),
    ma9: calculateSMA(prices, 20),
    ma21: calculateSMA(prices, 50),
    reasoning: explanation,
    currentPrice,
  };
};

/**
 * Analyze market condition
 * @param {Object} ohlcData - OHLC data
 * @returns {string} - Market condition (strong_uptrend, uptrend, consolidation, downtrend, strong_downtrend)
 */
export const analyzeMarketCondition = (ohlcData) => {
  if (!ohlcData || !ohlcData.closes || ohlcData.closes.length < 50) {
    return "unknown";
  }

  const sma20 = calculateSMA(ohlcData.closes, 20);
  const sma50 = calculateSMA(ohlcData.closes, 50);
  const sma200 = calculateSMA(ohlcData.closes, Math.min(200, ohlcData.closes.length));
  const currentPrice = ohlcData.closes[ohlcData.closes.length - 1];

  if (!sma20 || !sma50) return "unknown";

  const volatility = calculateVolatility(ohlcData.closes);

  // Determine trend
  if (sma20 > sma50 && sma50 > sma200) {
    return volatility > 0.05 ? "strong_uptrend" : "uptrend";
  } else if (sma20 < sma50 && sma50 < sma200) {
    return volatility > 0.05 ? "strong_downtrend" : "downtrend";
  } else {
    return "consolidation";
  }
};

/**
 * Calculate volatility
 * @param {Array<number>} prices - Array of prices
 * @param {number} period - Period (typically 20)
 * @returns {number} - Volatility as decimal
 */
export const calculateVolatility = (prices, period = 20) => {
  if (!prices || prices.length < period) return 0;

  const slice = prices.slice(-period);
  const returns = [];

  for (let i = 1; i < slice.length; i++) {
    returns.push(Math.log(slice[i] / slice[i - 1]));
  }

  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;

  return Math.sqrt(variance);
};
