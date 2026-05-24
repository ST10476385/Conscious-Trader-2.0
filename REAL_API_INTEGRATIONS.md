# Real API Integrations - Khanyisa Trading App

This document explains the real API integrations for market data and news feeds in your trading application.

## 📊 Overview

Your app now connects to **multiple real-time data sources** for accurate market information:

### Market Data Sources
- **Binance API** - Cryptocurrency data (free, no key required)
- **Alpha Vantage** - Forex and stock data (free tier available)
- **CoinGecko** - Cryptocurrency data (free, no key required)

### News Sources
- **NewsAPI** - Financial news aggregator (free tier available)
- **CryptoPanic** - Crypto-specific news (free, no key required)

## 🔑 API Keys Setup

### 1. Alpha Vantage (Forex & Stocks)
- **Website**: https://www.alphavantage.co/
- **Cost**: Free (with 5 requests/min limit)
- **Setup**:
  1. Go to https://www.alphavantage.co/
  2. Enter your email to get a free API key
  3. Add to `.env.local`:
     ```
     VITE_ALPHA_VANTAGE_KEY=your_key_here
     ```

### 2. NewsAPI (Financial News)
- **Website**: https://newsapi.org/
- **Cost**: Free (with 100 requests/day limit)
- **Setup**:
  1. Go to https://newsapi.org/
  2. Sign up and get your API key
  3. Add to `.env.local`:
     ```
     VITE_NEWSAPI_KEY=your_key_here
     ```

### 3. Binance API (No Key Needed)
- **Website**: https://binance-docs.github.io/apidocs/
- **Cost**: Free for public API endpoints
- **Data Available**: Bitcoin, Ethereum, altcoins OHLC data
- **No setup needed** - works automatically

### 4. CoinGecko API (No Key Needed)
- **Website**: https://www.coingecko.com/api
- **Cost**: Free for public API
- **Data Available**: Crypto prices, market cap, historical data
- **No setup needed** - works automatically

## 📝 Environment Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API keys** to `.env.local`:
   ```
   VITE_ALPHA_VANTAGE_KEY=YOUR_KEY_HERE
   VITE_NEWSAPI_KEY=YOUR_KEY_HERE
   ```

3. **Restart development server**:
   ```bash
   npm run dev
   ```

## 🎯 Available Data

### Market Prices
- **Bitcoin (BTC/USD)** - Real-time from Binance
- **Ethereum (ETH/USD)** - Real-time from Binance
- **EUR/USD** - From Alpha Vantage
- **GBP/USD** - From Alpha Vantage
- **And more pairs** - Configurable

### OHLC Data (for charts)
- 1-minute to 1-month intervals
- Up to 100 candles per request
- Used for technical analysis and charting

### News Feeds
- **Trending News** - Global business headlines
- **Financial News** - Forex, stocks, trading news
- **Crypto News** - Bitcoin, Ethereum, altcoin news
- **Sentiment Analysis** - Positive, neutral, negative classification

### Crypto Data
- Current prices with market cap
- 24hr volume
- Historical price data (configurable timeframe)

## 🔧 Code Examples

### Using Market Data

```javascript
import { useMarketPrice, useOHLCData } from '@/hooks/useMarketData';

function MyComponent() {
  // Get current price
  const { data: price } = useMarketPrice('BTC/USD', 5000);

  // Get OHLC data for chart
  const { data: ohlcData } = useOHLCData('EUR/USD', '1h', 100);

  return (
    <div>
      <p>BTC Price: ${price}</p>
      <p>Chart Points: {ohlcData?.length}</p>
    </div>
  );
}
```

### Using News Data

```javascript
import { useTrendingNews, useFinancialNews, useCryptoNews } from '@/hooks/useMarketData';

function NewsComponent() {
  const { data: trending } = useTrendingNews(10);
  const { data: financial } = useFinancialNews('trading', 15);
  const { data: crypto } = useCryptoNews(20);

  return (
    <div>
      {trending?.map(news => (
        <div key={news.id}>
          <h3>{news.title}</h3>
          <p>Sentiment: {news.sentiment}</p>
        </div>
      ))}
    </div>
  );
}
```

### Real-time Price Subscription

```javascript
import { usePriceSubscription } from '@/hooks/useMarketData';

function PriceTracker() {
  const { price, timestamp } = usePriceSubscription('BTC/USD');

  return (
    <div>
      <p>Current Price: ${price}</p>
      <p>Updated: {timestamp?.toLocaleTimeString()}</p>
    </div>
  );
}
```

## 📈 Data Flow

```
┌─────────────────────────────────────────┐
│   React Components (Dashboard, News)    │
└────────────────┬────────────────────────┘
                 │ uses
                 ▼
┌─────────────────────────────────────────┐
│   React Query Hooks (useMarketData.js)  │
│   - Caching & refetching logic          │
│   - Automatic stale data management     │
└────────────────┬────────────────────────┘
                 │ calls
                 ▼
┌─────────────────────────────────────────┐
│   API Clients                           │
│   - marketDataClient.js                 │
│   - newsClient.js                       │
└────────────────┬────────────────────────┘
                 │ calls
                 ▼
┌─────────────────────────────────────────┐
│   External APIs                         │
│   - Binance, Alpha Vantage              │
│   - NewsAPI, CoinGecko                  │
└─────────────────────────────────────────┘
```

## 🔄 Caching & Performance

All data is cached using React Query:
- **Prices**: Cached for 4 seconds, refetch every 5 seconds
- **OHLC Data**: Cached for 1 minute, refetch every 1 minute
- **News**: Cached for 10 minutes, refetch every 10 minutes
- **Crypto Data**: Cached for 9 seconds, refetch every 10 seconds

This ensures:
- ✅ Fast loading from cache
- ✅ Fresh data automatically
- ✅ Minimal API calls
- ✅ Reduced bandwidth usage

## ⚠️ API Rate Limits

### Alpha Vantage
- **Free Tier**: 5 requests per minute
- **Solution**: Stagger requests, use caching

### NewsAPI
- **Free Tier**: 100 requests per day
- **Solution**: Cache news for 10+ minutes

### Binance
- **Free Tier**: Generous limits (no issues for retail trading)
- **WebSocket**: Real-time price updates included

### CoinGecko
- **Free Tier**: Very generous (50 calls/minute)
- **No Authentication**: Works immediately

## 🚀 Features Available

### Market Data Component
- Real-time price ticker
- OHLC data for technical analysis
- WebSocket real-time updates
- Multi-pair data fetching
- Crypto prices with market cap

### News Component
- Trending financial news
- Forex/stock news
- Crypto-specific news
- Sentiment analysis
- Search functionality
- Multiple source aggregation

### Auto-Refresh
- Prices update every 5 seconds
- News updates every 10 minutes
- OHLC data updates every 1 minute
- All configured in React Query hooks

## 🎨 UI Components Using Real Data

### Dashboard
- **Equity Chart**: Uses real trade P&L data
- **Stats Cards**: Display balance in ZAR with real market data
- **Active Signals**: Show real prices from Binance/Alpha Vantage

### News Page
- **Trending News**: Shows real headlines from NewsAPI
- **Sentiment Counter**: Real sentiment from news articles
- **News Cards**: Display with source, sentiment, and publish time

### Analysis Page
- **Price Data**: Real OHLC from Binance/Alpha Vantage
- **Technical Indicators**: Calculated on real price data
- **Charts**: Render real market data

## ⚙️ Configuration

### Add More Trading Pairs

Edit `marketDataClient.js` to add more pairs:

```javascript
export const getCurrentPrice = async (pair) => {
  // Add more conditions for different pairs
  if (pair.includes('XAU')) {
    return await getAlphaVantagePrice('XAU', 'USD'); // Gold
  }
  // ... existing code
};
```

### Change Refresh Intervals

Edit `useMarketData.js` hooks:

```javascript
export const useMarketPrice = (pair, refetchInterval = 5000) => {
  // Change 5000 to different milliseconds
  return useQuery({
    queryKey: ['marketPrice', pair],
    queryFn: () => marketDataClient.getCurrentPrice(pair),
    refetchInterval, // 5 seconds by default
  });
};
```

### Add New News Source

Edit `newsClient.js`:

```javascript
export const getCustomNews = async () => {
  // Add your custom news source here
  const response = await fetch('your-api-endpoint');
  return response.json();
};
```

## 🐛 Troubleshooting

### "API returned error" in console
- **Cause**: No API key provided or rate limit exceeded
- **Fix**: 
  1. Check if API key is in `.env.local`
  2. Verify key is correct on provider's dashboard
  3. Wait a few minutes if rate limit hit

### Prices showing as `null`
- **Cause**: API endpoint error or unsupported pair
- **Fix**:
  1. Check console for error messages
  2. Verify pair name matches available pairs
  3. Try refreshing page

### No news appearing
- **Cause**: NewsAPI key missing or rate limit exceeded
- **Fix**:
  1. Add `VITE_NEWSAPI_KEY` to `.env.local`
  2. Check NewsAPI daily limit (100 free requests/day)
  3. Mock news will show if API fails

### WebSocket not connecting
- **Cause**: Browser security or ISP blocking
- **Fix**:
  1. Check browser console for connection errors
  2. App still works - falls back to HTTP polling
  3. Disable VPN if using one

## 📚 API References

- **Binance**: https://binance-docs.github.io/apidocs/
- **Alpha Vantage**: https://www.alphavantage.co/documentation/
- **NewsAPI**: https://newsapi.org/docs
- **CoinGecko**: https://www.coingecko.com/api/documentation
- **CryptoPanic**: https://cryptopanic.com/api/

## 🎯 Next Steps

1. **Get API Keys**:
   - Sign up for Alpha Vantage (forex/stocks)
   - Sign up for NewsAPI (financial news)
   - Add to `.env.local`

2. **Test the Integration**:
   - Open Dashboard to see prices
   - Open News to see articles
   - Check browser console for errors

3. **Customize Data**:
   - Adjust refresh intervals
   - Add more trading pairs
   - Add more news sources

4. **Monitor Usage**:
   - Track API calls in provider dashboards
   - Adjust caching if hitting rate limits
   - Upgrade API plan if needed

---

**Questions?** Check the API documentation links above or review the code in:
- `src/api/marketDataClient.js` - Market data
- `src/api/newsClient.js` - News feeds
- `src/hooks/useMarketData.js` - React hooks
