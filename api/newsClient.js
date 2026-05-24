/**
 * News API Client
 * Real-time financial news from multiple sources:
 * - NewsAPI (news aggregator - requires API key)
 * - CryptoNews (crypto-specific news - free)
 * - CNBC/Reuters feeds (via NewsAPI)
 */

const NEWSAPI_KEY = import.meta.env.VITE_NEWSAPI_KEY || 'demo';
const NEWSAPI_BASE = 'https://newsapi.org/v2';
const CRYPTONEWS_API = 'https://cryptopanic.com/api/v1';

/**
 * Get financial news by keywords
 */
export const getFinancialNews = async (keywords = 'trading', limit = 20) => {
  try {
    if (NEWSAPI_KEY === 'demo') {
      return getLocalMockNews(keywords, limit);
    }

    const response = await fetch(
      `${NEWSAPI_BASE}/everything?q=${keywords}&sortBy=publishedAt&language=en&pageSize=${limit}&apiKey=${NEWSAPI_KEY}`
    );
    const data = await response.json();

    return (data.articles || []).map(article => ({
      id: article.url,
      title: article.title,
      description: article.description,
      content: article.content,
      source: article.source.name,
      url: article.url,
      image: article.urlToImage,
      publishedAt: new Date(article.publishedAt),
      sentiment: analyzeSentiment(article.title + ' ' + article.description),
    }));
  } catch (error) {
    console.error('Error fetching financial news:', error);
    return getLocalMockNews(keywords, limit);
  }
};

/**
 * Get crypto-specific news
 */
export const getCryptoNews = async (limit = 20) => {
  try {
    // Try CryptoPanic first
    const response = await fetch(`${CRYPTONEWS_API}/posts/?auth_token=&public=true&limit=${limit}`);
    const data = await response.json();

    return (data.results || []).map(article => ({
      id: article.id,
      title: article.title,
      description: article.source?.title,
      url: article.url,
      publishedAt: new Date(article.published_at),
      sentiment: article.vote?.negative
        ? 'negative'
        : article.vote?.positive
        ? 'positive'
        : 'neutral',
      source: article.source?.title || 'CryptoPanic',
    }));
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    return getLocalMockNews('cryptocurrency bitcoin ethereum', limit);
  }
};

/**
 * Get market-specific news (e.g., EUR/USD, GBP/USD, BTC/USD)
 */
export const getMarketNews = async (pair, limit = 15) => {
  try {
    let keywords = pair.replace('/', ' ');
    if (pair.includes('BTC')) keywords = 'Bitcoin BTC';
    else if (pair.includes('ETH')) keywords = 'Ethereum ETH';
    else if (pair.includes('EUR')) keywords = 'Euro EUR forex';
    else if (pair.includes('GBP')) keywords = 'British Pound GBP forex';

    return await getFinancialNews(keywords, limit);
  } catch (error) {
    console.error(`Error fetching news for ${pair}:`, error);
    return [];
  }
};

/**
 * Get trending topics in financial markets
 */
export const getTrendingNews = async (limit = 10) => {
  try {
    if (NEWSAPI_KEY === 'demo') {
      return getLocalMockNews('stock market trading', limit);
    }

    const response = await fetch(
      `${NEWSAPI_BASE}/top-headlines?category=business&country=us&pageSize=${limit}&apiKey=${NEWSAPI_KEY}`
    );
    const data = await response.json();

    return (data.articles || []).map(article => ({
      id: article.url,
      title: article.title,
      description: article.description,
      source: article.source.name,
      url: article.url,
      image: article.urlToImage,
      publishedAt: new Date(article.publishedAt),
      trending: true,
    }));
  } catch (error) {
    console.error('Error fetching trending news:', error);
    return getLocalMockNews('stock market', limit);
  }
};

/**
 * Search news by multiple filters
 */
export const searchNews = async (options = {}) => {
  const {
    query = 'trading',
    sources = [],
    from = null,
    to = null,
    sortBy = 'publishedAt',
    language = 'en',
    limit = 50,
  } = options;

  try {
    if (NEWSAPI_KEY === 'demo') {
      return getLocalMockNews(query, limit);
    }

    let url = `${NEWSAPI_BASE}/everything?q=${query}&sortBy=${sortBy}&language=${language}&pageSize=${limit}&apiKey=${NEWSAPI_KEY}`;

    if (sources.length > 0) {
      url += `&sources=${sources.join(',')}`;
    }
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;

    const response = await fetch(url);
    const data = await response.json();

    return (data.articles || []).map(article => ({
      id: article.url,
      title: article.title,
      description: article.description,
      content: article.content,
      source: article.source.name,
      url: article.url,
      image: article.urlToImage,
      publishedAt: new Date(article.publishedAt),
      sentiment: analyzeSentiment(article.title),
    }));
  } catch (error) {
    console.error('Error searching news:', error);
    return getLocalMockNews(query, limit);
  }
};

/**
 * Simple sentiment analysis (very basic, using keyword matching)
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

/**
 * Get mock news for demo/testing (when no API key)
 */
function getLocalMockNews(keywords = 'trading', limit = 20) {
  const mockNews = [
    {
      id: '1',
      title: 'Markets Rally as Economic Data Beats Expectations',
      description: 'Global markets showed strong performance today with positive economic indicators.',
      source: 'Financial Times',
      url: 'https://ft.com',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sentiment: 'positive',
    },
    {
      id: '2',
      title: 'Bitcoin Surges Past Previous Resistance Level',
      description: 'Cryptocurrency market shows bullish momentum with Bitcoin breaking key technical levels.',
      source: 'CoinDesk',
      url: 'https://coindesk.com',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      sentiment: 'positive',
    },
    {
      id: '3',
      title: 'Federal Reserve Holds Interest Rates Steady',
      description: 'Central bank maintains current monetary policy, signaling stability in financial markets.',
      source: 'Reuters',
      url: 'https://reuters.com',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      sentiment: 'neutral',
    },
    {
      id: '4',
      title: 'Tech Stocks Face Headwinds Amid Regulatory Concerns',
      description: 'Technology sector struggles as new regulations threaten growth prospects.',
      source: 'Bloomberg',
      url: 'https://bloomberg.com',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      sentiment: 'negative',
    },
    {
      id: '5',
      title: 'Ethereum Upgrades Drive Network Activity Higher',
      description: 'Latest blockchain improvements boost transaction volumes and investor confidence.',
      source: 'The Block',
      url: 'https://theblock.co',
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      sentiment: 'positive',
    },
    {
      id: '6',
      title: 'Dollar Strengthens as Safe-Haven Flows Continue',
      description: 'USD gains ground against major currencies due to global uncertainty.',
      source: 'MarketWatch',
      url: 'https://marketwatch.com',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      sentiment: 'neutral',
    },
  ];

  return mockNews.slice(0, limit);
}

export default {
  getFinancialNews,
  getCryptoNews,
  getMarketNews,
  getTrendingNews,
  searchNews,
};
