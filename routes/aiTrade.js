import express from 'express';

const router = express.Router();

const MT5_BRIDGE_URL = process.env.MT5_BRIDGE_URL || 'http://localhost:5001/execute';
const MAX_LOT_SIZE = Number(process.env.MT5_MAX_LOT || '0.1');
const VALID_SYMBOL_PATTERN = /^[A-Z0-9\.\-_]{3,12}$/;

const validateTradePayload = (payload) => {
  const errors = [];
  const action = String(payload.action || '').toUpperCase();
  const symbol = String(payload.symbol || '').trim();
  const lot = Number(payload.lot);
  const stopLoss = Number(payload.stopLoss);
  const takeProfit = Number(payload.takeProfit);

  if (!['BUY', 'SELL'].includes(action)) {
    errors.push('Invalid action. Expected BUY or SELL.');
  }

  if (!symbol || !VALID_SYMBOL_PATTERN.test(symbol)) {
    errors.push('Invalid symbol. Use uppercase ticker like XAUUSD or EURUSD.');
  }

  if (!Number.isFinite(lot) || lot <= 0) {
    errors.push('Invalid lot size. Must be a positive number.');
  } else if (lot > MAX_LOT_SIZE) {
    errors.push(`Lot size too large. Maximum allowed is ${MAX_LOT_SIZE}.`);
  }

  if (!Number.isFinite(stopLoss)) {
    errors.push('Stop loss is required and must be a number.');
  }

  if (!Number.isFinite(takeProfit)) {
    errors.push('Take profit is required and must be a number.');
  }

  return {
    action,
    symbol,
    lot,
    stopLoss,
    takeProfit,
    errors,
  };
};

router.post('/trade', async (req, res) => {
  const payload = req.body || {};
  const { action, symbol, lot, stopLoss, takeProfit, errors } = validateTradePayload(payload);

  console.log('[AI SIGNAL] Received trade request:', { action, symbol, lot, stopLoss, takeProfit });

  if (errors.length > 0) {
    console.warn('[AI SIGNAL] Validation failed:', errors);
    return res.status(400).json({ status: 'error', errors });
  }

  try {
    console.log('[MT5 BRIDGE] Forwarding trade to Python bridge:', MT5_BRIDGE_URL);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(MT5_BRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, symbol, lot, stopLoss, takeProfit }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const bridgeResult = await response.json();

    if (!response.ok) {
      console.error('[MT5 BRIDGE] Bridge returned error:', bridgeResult);
      return res.status(response.status).json({ status: 'error', message: bridgeResult.message || 'MT5 bridge error', details: bridgeResult });
    }

    console.log('[MT5 BRIDGE] Trade executed successfully:', bridgeResult);
    return res.status(200).json({ status: 'ok', data: bridgeResult });
  } catch (error) {
    console.error('[MT5 BRIDGE] Forwarding failed:', error);
    return res.status(502).json({ status: 'error', message: 'Failed to send trade to MT5 bridge', details: error.message });
  }
});

export default router;
