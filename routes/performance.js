import express from 'express';
import { pool } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Middleware
router.use(authMiddleware);

// Get user's account balance
router.get('/balance', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT account_balance FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      accountBalance: result.rows[0].account_balance,
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Calculate daily P&L
router.get('/daily-pnl', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(profit_loss), 0) as daily_pnl
       FROM trade_executions te
       JOIN trades t ON te.trade_id = t.id
       WHERE t.user_id = $1
       AND DATE(te.executed_at) = CURRENT_DATE`,
      [req.userId]
    );

    res.json({
      dailyPnL: result.rows[0].daily_pnl || 0,
    });
  } catch (error) {
    console.error('Error calculating daily P&L:', error);
    res.status(500).json({ error: 'Failed to calculate P&L' });
  }
});

// Get performance statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT t.id) as total_trades,
        COUNT(DISTINCT CASE WHEN te.profit_loss > 0 THEN t.id END) as winning_trades,
        COUNT(DISTINCT CASE WHEN te.profit_loss < 0 THEN t.id END) as losing_trades,
        COALESCE(SUM(te.profit_loss), 0) as total_profit_loss,
        COALESCE(MAX(te.profit_loss), 0) as best_trade,
        COALESCE(MIN(te.profit_loss), 0) as worst_trade
       FROM trades t
       LEFT JOIN trade_executions te ON t.id = te.trade_id
       WHERE t.user_id = $1
       AND t.status IN ('executed', 'closed')`,
      [req.userId]
    );

    const stats = result.rows[0];
    const winRate = stats.total_trades > 0
      ? ((stats.winning_trades / stats.total_trades) * 100).toFixed(2)
      : 0;

    // Get starting balance for return calculation
    const userResult = await pool.query(
      'SELECT account_balance FROM users WHERE id = $1',
      [req.userId]
    );

    const startingBalance = userResult.rows[0].account_balance - stats.total_profit_loss;
    const returnPercentage = startingBalance > 0
      ? ((stats.total_profit_loss / startingBalance) * 100).toFixed(2)
      : 0;

    res.json({
      totalTrades: stats.total_trades || 0,
      winningTrades: stats.winning_trades || 0,
      losingTrades: stats.losing_trades || 0,
      winRate: parseFloat(winRate),
      totalProfitLoss: stats.total_profit_loss || 0,
      totalReturnPercentage: parseFloat(returnPercentage),
      bestTrade: stats.best_trade || 0,
      worstTrade: stats.worst_trade || 0,
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

// Get open positions
router.get('/positions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        t.id,
        t.pair,
        t.signal_type,
        t.entry_price,
        t.stop_loss,
        t.take_profit,
        t.position_size,
        t.created_at
       FROM trades t
       WHERE t.user_id = $1
       AND t.status IN ('approved', 'executed')
       ORDER BY t.created_at DESC`,
      [req.userId]
    );

    res.json({
      openPositions: result.rows || [],
      totalPositions: result.rows.length,
      totalExposure: result.rows.reduce((sum, pos) => sum + pos.position_size, 0),
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Get risk metrics
router.get('/risk-metrics', async (req, res) => {
  try {
    // Get user risk settings
    const userResult = await pool.query(
      `SELECT 
        daily_loss_limit,
        max_position_size,
        max_risk_per_trade,
        account_balance
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Calculate current metrics
    const positionsResult = await pool.query(
      `SELECT COALESCE(SUM(position_size), 0) as total_exposure
       FROM trades WHERE user_id = $1
       AND status IN ('approved', 'executed')`,
      [req.userId]
    );

    const dailyPnLResult = await pool.query(
      `SELECT COALESCE(SUM(profit_loss), 0) as daily_pnl
       FROM trade_executions te
       JOIN trades t ON te.trade_id = t.id
       WHERE t.user_id = $1
       AND DATE(te.executed_at) = CURRENT_DATE`,
      [req.userId]
    );

    const totalExposure = positionsResult.rows[0].total_exposure;
    const dailyPnL = dailyPnLResult.rows[0].daily_pnl;

    const exposurePercentage = (totalExposure / user.account_balance) * 100;
    const dailyLossLimitPercentage = (dailyPnL / user.daily_loss_limit) * 100;

    res.json({
      dailyLossLimit: user.daily_loss_limit,
      dailyPnL,
      dailyLossLimitPercentage: dailyLossLimitPercentage.toFixed(2),
      dailyLimitExceeded: dailyPnL < -user.daily_loss_limit,
      maxPositionSize: user.max_position_size,
      maxRiskPerTrade: user.max_risk_per_trade,
      accountBalance: user.account_balance,
      totalExposure,
      exposurePercentage: exposurePercentage.toFixed(2),
      exposureHealthy: exposurePercentage <= user.max_position_size,
    });
  } catch (error) {
    console.error('Error calculating risk metrics:', error);
    res.status(500).json({ error: 'Failed to calculate risk metrics' });
  }
});

// Update risk settings
router.put('/risk-settings', async (req, res) => {
  try {
    const { dailyLossLimit, maxPositionSize, maxRiskPerTrade } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET daily_loss_limit = COALESCE($1, daily_loss_limit),
           max_position_size = COALESCE($2, max_position_size),
           max_risk_per_trade = COALESCE($3, max_risk_per_trade),
           updated_at = NOW()
       WHERE id = $4
       RETURNING daily_loss_limit, max_position_size, max_risk_per_trade`,
      [dailyLossLimit, maxPositionSize, maxRiskPerTrade, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Risk settings updated',
      settings: {
        dailyLossLimit: result.rows[0].daily_loss_limit,
        maxPositionSize: result.rows[0].max_position_size,
        maxRiskPerTrade: result.rows[0].max_risk_per_trade,
      },
    });
  } catch (error) {
    console.error('Error updating risk settings:', error);
    res.status(500).json({ error: 'Failed to update risk settings' });
  }
});

export default router;
