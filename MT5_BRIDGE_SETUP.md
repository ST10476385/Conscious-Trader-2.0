# MT5 Bridge Setup Guide - Get Your Demo Account Trading! 🚀

Your MT5 demo account is now connected to Khanyisa! Here's how to set it up:

---

## 🎯 What You Have

✅ **mt5_bridge.py** - Python script that syncs MT5 data every 30 seconds  
✅ **conscious_trader_ea.mq5** - MT5 Expert Advisor for real-time events  
✅ **Backend webhooks** - Receives MT5 data at `/api/mt5/sync` and `/api/mt5/event`  

---

## ⚙️ **Setup Steps (5 Minutes)**

### Step 1: Install Python MetaTrader5 Library

```powershell
# Open PowerShell and run:
pip install MetaTrader5 requests schedule
```

✅ Should see: `Successfully installed MetaTrader5 requests schedule`

---

### Step 2: Verify MT5 Configuration in Python Script

Open `mt5_bridge.py` and check these match your account:

```python
ACCOUNT = 5040381959          # ✅ Your demo account
PASSWORD = "YaBDfFui"          # ✅ Your password
SERVER = "MetaQuotes-Demo"     # ✅ Your broker server
APP_WEBHOOK_URL = "http://localhost:5000/api/mt5/sync"  # Backend URL
```

**Don't change anything** - it's already configured! ✅

---

### Step 3: Setup MT5 Expert Advisor

1. Open **MetaTrader 5**
2. Go to **Tools → Options → Advisors**
3. ✅ Check **"Allow live trading"**
4. ✅ Check **"Allow WebRequests"** 
5. Add to DLL imports: Add `http://localhost:5000`
6. Click **OK**

---

### Step 4: Load Expert Advisor to MT5

1. Open MetaTrader 5
2. Go to **File → Open Data Folder**
3. Navigate to: `MQL5/Experts`
4. Copy `conscious_trader_ea.mq5` here
5. Go back to MT5
6. Press **Ctrl+R** to refresh
7. Go to **Navigator** (Ctrl+N)
8. Expand **Advisors**
9. Find **Khanyisa Trading Robot**
10. Drag it to any chart (e.g., EURUSD M5)
11. Click **OK**

✅ You should see: "✅ Khanyisa EA initialized on EURUSD"

---

### Step 5: Start Everything

You now need **3 terminals running**:

#### Terminal 1: Backend
```powershell
cd backend
npm run dev
```
Expected: `Server running on port 5000`

#### Terminal 2: Frontend
```powershell
npm run dev
```
Expected: `Local: http://localhost:5174`

#### Terminal 3: MT5 Bridge (NEW)
```powershell
python mt5_bridge.py
```
Expected:
```
✅ Connected to MT5
   Account: 5040381959
   Balance: $5,000.00
   Equity: $5,000.00

📡 Bridge running... Press Ctrl+C to stop
✅ Synced: 0 open, 0 closed | 12:34:56
```

---

## 🎯 **Test Everything (5 Minutes)**

### Test 1: MT5 Bridge Connection

1. Watch the Terminal 3 (MT5 Bridge) output
2. Should see ✅ sync messages every 30 seconds
3. If you see:
   ```
   ⚠️  Cannot connect to Khanyisa (http://localhost:5000)
   ```
   → Backend isn't running, start it in Terminal 1

### Test 2: Create and Execute Trade

1. Open `http://localhost:5174`
2. Register account
3. Go to **Signals** → **New Signal**
4. Create:
   ```
   Symbol: EURUSD
   Type: BUY
   Entry: 1.0850
   SL: 1.0800
   TP: 1.0900
   Size: 0.1 lots
   ```
5. Click **Approve** → Status: APPROVED ✅

### Test 3: Execute on MT5

1. Click **Execute on MT5**
2. Check MT5 terminal
3. Should see new order appear
4. In MT5, you should see:
   - New EURUSD BUY order
   - Stop loss at 1.0800
   - Take profit at 1.0900

✅ **Success!** Your app executed a real trade on MT5!

---

## 📊 **Monitor Live**

Now you can:

✅ **Create signals in Khanyisa**  
✅ **Execute on MT5**  
✅ **Monitor in real-time**  
✅ **Close from either platform**  

**In Khanyisa:**
- See order details
- Track P&L
- View performance stats

**In MT5:**
- See live price movements
- Manually adjust stops
- Close manually if needed

**Both sync every 30 seconds!**

---

## 🔧 **Troubleshooting**

### Problem: "Cannot connect to Khanyisa"
```
⚠️  Cannot connect to Khanyisa (http://localhost:5000)
```
**Solution:**
1. Is backend running? Check Terminal 1
2. Start it: `npm run dev` in backend folder
3. Should show: `Server running on port 5000`

---

### Problem: EA Won't Load in MT5
```
Cannot load expert advisor: Access denied
```
**Solution:**
1. Go to **Tools → Options → Advisors**
2. ✅ Enable **"Allow live trading"**
3. ✅ Enable **"Allow WebRequests"**
4. Add `http://localhost:5000` to DLL imports
5. Restart MT5
6. Load EA again

---

### Problem: Trade Doesn't Execute
```
No order appears in MT5 after clicking Execute
```
**Solution:**
1. Check MT5 Bridge terminal for errors
2. Verify EA is loaded (check terminal window for "✅ Khanyisa EA initialized")
3. Try creating order directly in MT5 first (to verify account works)
4. Check balance is sufficient

---

### Problem: Python Script Won't Run
```
ModuleNotFoundError: No module named 'MetaTrader5'
```
**Solution:**
```powershell
pip install MetaTrader5 requests schedule
```

---

## 📈 **Trading Workflow**

```
1. Create Signal in Khanyisa App
   ↓
2. Approve Signal (Status: APPROVED)
   ↓
3. Click "Execute on MT5"
   ↓
4. MT5 Expert Advisor receives command
   ↓
5. EA places order with SL and TP
   ↓
6. MT5 Bridge syncs status back to app
   ↓
7. Monitor position in both platforms
   ↓
8. Close from either platform
   ↓
9. P&L calculated and saved
   ↓
10. Performance updated in dashboard
```

---

## 🚀 **Production Deployment**

When you're ready to go live:

### Change URLs in Production

**mt5_bridge.py:**
```python
APP_WEBHOOK_URL = "https://your-railway-url.com/api/mt5/sync"
```

**conscious_trader_ea.mq5:**
```mql5
string WebhookURL = "https://your-railway-url.com/api/mt5/event";
```

**Then:**
1. Deploy backend to Railway
2. Get your Railway URL
3. Update both files
4. Restart MT5 Bridge
5. Reload EA in MT5
6. Done! 🎊

---

## ✅ **Quick Checklist**

- [ ] Installed Python MetaTrader5: `pip install MetaTrader5 requests schedule`
- [ ] Configured mt5_bridge.py with your account details
- [ ] Copied conscious_trader_ea.mq5 to MT5 MQL5/Experts folder
- [ ] Enabled "Allow live trading" in MT5 settings
- [ ] Enabled "Allow WebRequests" in MT5 settings
- [ ] Loaded Khanyisa EA to a chart in MT5
- [ ] Started backend: `npm run dev` (backend folder)
- [ ] Started frontend: `npm run dev` (root folder)
- [ ] Started MT5 Bridge: `python mt5_bridge.py`
- [ ] Created test signal in app
- [ ] Executed on MT5 ✅
- [ ] Saw order appear in MT5 ✅
- [ ] Closed trade ✅
- [ ] Verified P&L calculated ✅

---

## 🎉 **You're Ready!**

Your MT5 demo account is now **fully integrated** with Khanyisa!

**Next Steps:**
1. Test with several trades (paper trading is free!)
2. Monitor performance
3. When confident, switch to live account
4. Deploy to production
5. Start real trading! 💰

---

## 📞 **Need Help?**

**Check logs:**
- **Backend logs**: Terminal 1 (npm run dev)
- **Bridge logs**: Terminal 3 (python mt5_bridge.py)
- **MT5 logs**: MT5 terminal window (View → Toolbox → Trade)
- **Frontend console**: Browser F12 → Console tab

**Test connection:**
```powershell
# Check if backend is running
curl http://localhost:5000/health
```

Should return:
```json
{"status":"Backend is running","timestamp":"..."}
```

---

**Happy Trading! 🚀📈**

Your Khanyisa + MT5 integration is live and ready for action!
