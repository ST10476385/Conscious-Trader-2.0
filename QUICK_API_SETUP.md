# Quick API Setup Guide - 5 Minutes

Get real market data and news working in your Khanyisa app in 5 minutes!

## Step 1: Create .env.local (30 seconds)

Create a new file called `.env.local` in your project root:

```bash
# Copy the .env.example file
cp .env.example .env.local
```

Or create it manually with this content:

```
VITE_ALPHA_VANTAGE_KEY=demo
VITE_NEWSAPI_KEY=demo
```

## Step 2: Get Free API Keys (2 minutes)

### Alpha Vantage (Forex/Stocks)
1. Go to: https://www.alphavantage.co/
2. Enter your email → Get instant API key
3. Copy the key to `.env.local`:
   ```
   VITE_ALPHA_VANTAGE_KEY=YOUR_KEY_HERE
   ```

### NewsAPI (Financial News)
1. Go to: https://newsapi.org/
2. Sign up → Activate email → Get API key
3. Copy the key to `.env.local`:
   ```
   VITE_NEWSAPI_KEY=YOUR_KEY_HERE
   ```

## Step 3: Restart & Test (30 seconds)

```bash
# Stop development server (Ctrl+C)
# Restart it
npm run dev
```

Visit the app:
- **Dashboard** → Check if prices show in ZAR
- **News** → Should show real financial news
- **Analysis** → Real price charts should load

## ✅ That's It!

Your app now has:
- ✅ Real Bitcoin & Ethereum prices
- ✅ Real EUR/USD, GBP/USD rates
- ✅ Real financial news feeds
- ✅ Crypto news updates
- ✅ Sentiment analysis

## 🚀 What's Available Now

### Without API Keys (Demo Mode)
- Mock prices (randomized)
- Mock news (example stories)
- Chart functionality works
- Perfect for testing UI

### With API Keys
- Real Bitcoin prices (Binance)
- Real Ethereum prices (Binance)
- Real forex rates (Alpha Vantage)
- Real news headlines (NewsAPI)
- Real crypto news (CryptoPanic)
- Sentiment analysis on news

## 📊 Data Flow

```
Your App
    ↓
Market Data Hooks
    ↓
API Clients
    ↓
Real APIs (Binance, Alpha Vantage, etc.)
    ↓
Your Dashboard (prices, charts, news)
```

## 🐛 Troubleshooting

**"API returned error" in console?**
- Check if API key is in `.env.local`
- Restart npm dev server
- Verify key is correct on provider's dashboard

**Still seeing "demo" data?**
- Make sure `.env.local` file exists in root
- Restart development server after creating file
- Check browser console for error messages

**Rate limit errors?**
- Binance: No issues (generous limits)
- Alpha Vantage: 5 calls/min (respect this)
- NewsAPI: 100 calls/day (be careful)
- CoinGecko: Very generous, no worries

## 💡 Pro Tips

1. **Get started immediately**: Leave keys as "demo" to test UI first
2. **Get real data quickly**: Sign up for free keys (takes 1-2 minutes each)
3. **Test incrementally**: Refresh page after adding each API key
4. **Monitor usage**: Check your API provider dashboards to see calls

## 📚 Full Documentation

See `REAL_API_INTEGRATIONS.md` for detailed documentation covering:
- All available data sources
- Code examples
- Configuration options
- Rate limits
- Troubleshooting

## Next: Connect to Backend

After getting real APIs working, you can:
1. Create backend endpoints using `tradeServicesAPI.js`
2. Add database persistence for trades
3. Set up trade execution workflows
4. Deploy to production

---

**Ready?** Start the dev server and visit your app at http://localhost:5173! 🚀
