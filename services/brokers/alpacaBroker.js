/**
 * Alpaca Broker Integration Service
 * Real trade execution via Alpaca API
 * 
 * Alpaca API: https://alpaca.markets/
 * Documentation: https://docs.alpaca.markets/
 */

class AlpacaBrokerService {
  constructor(apiKey, apiSecret, isLiveTrading = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.isLiveTrading = isLiveTrading;
    
    // Use paper trading by default (safer, no real money)
    this.baseUrl = isLiveTrading
      ? 'https://api.alpaca.markets/v2'
      : 'https://paper-api.alpaca.markets/v2';
    
    this.dataUrl = 'https://data.alpaca.markets/v1beta1';
  }

  /**
   * Get authentication headers
   */
  getHeaders() {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get account information
   */
  async getAccount() {
    try {
      const response = await fetch(`${this.baseUrl}/account`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Alpaca API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    const account = await this.getAccount();
    return {
      cash: parseFloat(account.cash),
      portfolio_value: parseFloat(account.portfolio_value),
      buying_power: parseFloat(account.buying_power),
      equity: parseFloat(account.equity),
    };
  }

  /**
   * Place market order
   * @param {Object} orderData - { symbol, qty, side ('buy'|'sell'), type ('market'|'limit'), limit_price }
   */
  async placeOrder(orderData) {
    const {
      symbol,
      qty,
      side,
      type = 'market',
      limit_price,
      stop_price,
    } = orderData;

    try {
      const body = {
        symbol,
        qty,
        side, // 'buy' or 'sell'
        type, // 'market', 'limit', 'stop', 'stop_limit'
        time_in_force: 'day', // day, gtc, opg, cls
      };

      if (type === 'limit' && limit_price) {
        body.limit_price = limit_price;
      }

      if (type === 'stop' && stop_price) {
        body.stop_price = stop_price;
      }

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Order failed: ${error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Place order with stop loss and take profit
   */
  async placeOrderWithLevels(orderData) {
    const {
      symbol,
      qty,
      side,
      entry_price,
      stop_loss,
      take_profit,
    } = orderData;

    try {
      // Place entry order
      const entryOrder = await this.placeOrder({
        symbol,
        qty,
        side,
        type: 'limit',
        limit_price: entry_price,
      });

      // Place stop loss order (reverse side, smaller qty if partial exit)
      const slQty = qty; // Usually same qty for full exit
      const slSide = side === 'buy' ? 'sell' : 'buy';

      const stopLossOrder = await this.placeOrder({
        symbol,
        qty: slQty,
        side: slSide,
        type: 'stop',
        stop_price: stop_loss,
      });

      // Place take profit order
      const tpQty = qty;
      const tpSide = side === 'buy' ? 'sell' : 'buy';

      const takeProfitOrder = await this.placeOrder({
        symbol,
        qty: tpQty,
        side: tpSide,
        type: 'limit',
        limit_price: take_profit,
      });

      return {
        entryOrder,
        stopLossOrder,
        takeProfitOrder,
      };
    } catch (error) {
      console.error('Error placing order with levels:', error);
      throw error;
    }
  }

  /**
   * Get open positions
   */
  async getPositions() {
    try {
      const response = await fetch(`${this.baseUrl}/positions`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Alpaca API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  /**
   * Close position
   */
  async closePosition(symbol, percentOrQty = 100) {
    try {
      const response = await fetch(`${this.baseUrl}/positions/${symbol}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: JSON.stringify({ percentage: percentOrQty }), // 0-100
      });

      if (!response.ok) {
        throw new Error(`Failed to close position: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId) {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      return { success: true };
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(status = 'closed', limit = 50) {
    try {
      const response = await fetch(
        `${this.baseUrl}/orders?status=${status}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch order history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  }

  /**
   * Get current bars (price data)
   */
  async getBars(symbol, timeframe = '1H', limit = 100) {
    try {
      const response = await fetch(
        `${this.dataUrl}/bars?symbols=${symbol}&timeframe=${timeframe}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'APCA-API-KEY-ID': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch bars');
      }

      const data = await response.json();
      return data.bars[symbol] || [];
    } catch (error) {
      console.error('Error fetching bars:', error);
      throw error;
    }
  }

  /**
   * Subscribe to WebSocket for real-time data
   */
  connectWebSocket(onMessage, onError) {
    const wsUrl = 'wss://data.alpaca.markets/v1beta1/crypto';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Alpaca WebSocket connected');
      // Send auth message
      ws.send(
        JSON.stringify({
          action: 'auth',
          key: this.apiKey,
          secret: this.apiSecret,
        })
      );

      // Subscribe to updates
      ws.send(
        JSON.stringify({
          action: 'subscribe',
          trades: ['BTC/USD', 'ETH/USD'],
          quotes: ['BTC/USD', 'ETH/USD'],
          bars: ['BTC/USD', 'ETH/USD'],
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return ws;
  }
}

export default AlpacaBrokerService;
