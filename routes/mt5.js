// backend/routes/mt5.js
// MT5 Bridge webhook endpoints - receives sync data and trade events from MT5

import { pool } from '../db/database.js';

export const setupMT5Routes = (app) => {
  
  // =====================================================
  // POST /api/mt5/sync - Receive MT5 position sync
  // =====================================================
  app.post('/api/mt5/sync', async (req, res) => {
    try {
      const { open_trades, closed_trades, account, timestamp } = req.body;
      
      console.log(`📊 MT5 Sync received at ${timestamp}`);
      console.log(`   Open trades: ${(open_trades || []).length}`);
      console.log(`   Closed trades: ${(closed_trades || []).length}`);
      
      // Update account info in database (optional)
      if (account) {
        try {
          await pool.query(
            `INSERT INTO mt5_account_sync 
             (account_id, balance, equity, free_margin, margin_used, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (timestamp) DO UPDATE SET 
             balance = $2, equity = $3, free_margin = $4, margin_used = $5`,
            [
              account.login,
              account.balance,
              account.equity,
              account.margin_free,
              account.margin,
              new Date(timestamp)
            ]
          );
        } catch (err) {
          // Table might not exist, that's okay
          console.log('ℹ️  MT5 account sync table not created');
        }
      }
      
      res.json({ 
        status: 'ok',
        message: 'MT5 sync received',
        open_trades_count: (open_trades || []).length,
        closed_trades_count: (closed_trades || []).length
      });
      
    } catch (error) {
      console.error('❌ MT5 sync error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // =====================================================
  // POST /api/mt5/event - Receive trade events from MT5
  // =====================================================
  app.post('/api/mt5/event', async (req, res) => {
    try {
      const { event, symbol, volume, price, profit, ticket, timestamp } = req.body;
      
      console.log(`📈 MT5 Event: ${event} | ${symbol} | Ticket: ${ticket} | Profit: ${profit}`);
      
      // Log trade event (optional - for debugging)
      try {
        await pool.query(
          `INSERT INTO mt5_trade_events 
           (ticket, symbol, volume, price, profit, event_type, timestamp, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [ticket, symbol, volume, price, profit, event, new Date(timestamp)]
        );
      } catch (err) {
        // Table might not exist, that's okay
        console.log('ℹ️  MT5 events table not created');
      }
      
      res.json({ 
        status: 'ok',
        message: 'Trade event recorded',
        event_type: event,
        ticket: ticket
      });
      
    } catch (error) {
      console.error('❌ MT5 event error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // =====================================================
  // GET /api/mt5/health - Check bridge connection
  // =====================================================
  app.get('/api/mt5/health', async (req, res) => {
    try {
      res.json({ 
        status: 'ok',
        message: 'MT5 webhook endpoint is active',
        timestamp: new Date().toISOString(),
        endpoint: '/api/mt5/sync, /api/mt5/event'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================================================
  // GET /api/mt5/account - Get MT5 account info from the local bridge
  // =====================================================
  app.get('/api/mt5/account', async (req, res) => {
    try {
      const bridgeUrl = new URL(process.env.MT5_BRIDGE_URL || 'http://localhost:5001/execute');
      bridgeUrl.pathname = '/account';

      const response = await fetch(bridgeUrl.href, { method: 'GET' });
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ status: 'error', message: data.message || 'MT5 bridge error', details: data });
      }

      return res.json(data);
    } catch (error) {
      console.error('❌ MT5 account fetch failed:', error);
      return res.status(502).json({ status: 'error', message: 'Failed to fetch MT5 account info', details: error.message });
    }
  });
};
