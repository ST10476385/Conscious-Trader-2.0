import express from 'express';
import { pool } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Middleware to extract user ID from token
router.use(authMiddleware);

// Get all trades for user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get single trade
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trade:', error);
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// Create new trade for approval
router.post('/', async (req, res) => {
  try {
    const {
      pair,
      signalType,
      entryPrice,
      stopLoss,
      takeProfitPrice,
      positionSize,
      confidence,
      reason,
      notes,
    } = req.body;

    // Validate required fields
    if (!pair || !signalType || !entryPrice || !stopLoss || !takeProfitPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO trades 
       (user_id, pair, signal_type, entry_price, stop_loss, take_profit, position_size, confidence, reason, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        req.userId,
        pair,
        signalType,
        entryPrice,
        stopLoss,
        takeProfitPrice,
        positionSize || 0,
        confidence || 0,
        reason || '',
        notes || '',
        'pending_approval',
      ]
    );

    res.status(201).json({
      message: 'Trade created, awaiting approval',
      trade: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating trade:', error);
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

// Approve trade
router.put('/:id/approve', async (req, res) => {
  try {
    const { notes } = req.body;

    // Get trade
    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = tradeResult.rows[0];

    if (trade.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Trade cannot be approved in current status' });
    }

    // Update trade status
    const result = await pool.query(
      'UPDATE trades SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      ['approved', notes || trade.notes, req.params.id]
    );

    res.json({
      message: 'Trade approved',
      trade: result.rows[0],
    });
  } catch (error) {
    console.error('Error approving trade:', error);
    res.status(500).json({ error: 'Failed to approve trade' });
  }
});

// Reject trade
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;

    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const result = await pool.query(
      'UPDATE trades SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      ['rejected', reason || 'Trade rejected', req.params.id]
    );

    res.json({
      message: 'Trade rejected',
      trade: result.rows[0],
    });
  } catch (error) {
    console.error('Error rejecting trade:', error);
    res.status(500).json({ error: 'Failed to reject trade' });
  }
});

// Execute approved trade
router.put('/:id/execute', async (req, res) => {
  try {
    const { notes } = req.body;

    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = tradeResult.rows[0];

    if (trade.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved trades can be executed' });
    }

    // Update trade status to executed
    const result = await pool.query(
      'UPDATE trades SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      ['executed', notes || trade.notes, req.params.id]
    );

    // Record execution
    await pool.query(
      'INSERT INTO trade_executions (trade_id, status) VALUES ($1, $2)',
      [req.params.id, 'executed']
    );

    res.json({
      message: 'Trade executed successfully',
      trade: result.rows[0],
    });
  } catch (error) {
    console.error('Error executing trade:', error);
    res.status(500).json({ error: 'Failed to execute trade' });
  }
});

// Close trade with exit price
router.put('/:id/close', async (req, res) => {
  try {
    const { exitPrice } = req.body;

    if (!exitPrice) {
      return res.status(400).json({ error: 'Exit price required' });
    }

    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = tradeResult.rows[0];

    // Calculate P&L
    const priceDifference = exitPrice - trade.entry_price;
    const profitLoss = priceDifference * trade.position_size;
    const profitLossPercentage = (priceDifference / trade.entry_price) * 100;

    // Update trade
    const result = await pool.query(
      'UPDATE trades SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['closed', req.params.id]
    );

    // Record execution with exit price and P&L
    await pool.query(
      'INSERT INTO trade_executions (trade_id, exit_price, profit_loss, profit_loss_percentage, status) VALUES ($1, $2, $3, $4, $5)',
      [req.params.id, exitPrice, profitLoss, profitLossPercentage, 'closed']
    );

    res.json({
      message: 'Trade closed',
      trade: result.rows[0],
      execution: {
        exitPrice,
        profitLoss,
        profitLossPercentage: profitLossPercentage.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Error closing trade:', error);
    res.status(500).json({ error: 'Failed to close trade' });
  }
});

// Get open trades
router.get('/status/open', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trades WHERE user_id = $1 AND status IN ('approved', 'executed') ORDER BY created_at DESC",
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching open trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get closed trades
router.get('/status/closed', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trades WHERE user_id = $1 AND status = 'closed' ORDER BY created_at DESC",
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching closed trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

export default router;
