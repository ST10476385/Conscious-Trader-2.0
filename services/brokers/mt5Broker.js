/**
 * MetaTrader 5 (MT5) Broker Integration Service
 * Real trade execution via MT5
 * 
 * Requires: MT5 Bridge server running (WebSocket/gRPC)
 * Alternative: Use MT5 Python API
 * 
 * MT5 Documentation: https://www.metatrader5.com/en/docs
 */

class MT5BrokerService {
  constructor(brokerServer, account, password, server = 'broker_server') {
    this.brokerServer = brokerServer; // e.g., 'localhost:8080'
    this.account = account;
    this.password = password;
    this.server = server; // Broker server name
    this.ws = null;
    this.isConnected = false;
    this.messageId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * Connect to MT5 WebSocket bridge
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://${this.brokerServer}/mt5`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Connected to MT5 bridge');
          this.isConnected = true;
          
          // Send login command
          this.sendCommand('LOGIN', {
            account: this.account,
            password: this.password,
            server: this.server,
          }).then(() => {
            console.log('MT5 login successful');
            resolve();
          }).catch(reject);
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        };

        this.ws.onerror = (error) => {
          console.error('MT5 WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('MT5 WebSocket closed');
          this.isConnected = false;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send command to MT5 bridge
   */
  sendCommand(command, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to MT5'));
        return;
      }

      const msgId = ++this.messageId;
      const message = {
        id: msgId,
        command,
        params,
      };

      // Store pending request
      this.pendingRequests.set(msgId, { resolve, reject });

      // Send message
      this.ws.send(JSON.stringify(message));

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(msgId)) {
          this.pendingRequests.delete(msgId);
          reject(new Error(`Command ${command} timed out`));
        }
      }, 10000);
    });
  }

  /**
   * Handle WebSocket message response
   */
  handleMessage(data) {
    const { id, success, result, error } = data;

    if (id && this.pendingRequests.has(id)) {
      const { resolve, reject } = this.pendingRequests.get(id);
      this.pendingRequests.delete(id);

      if (success) {
        resolve(result);
      } else {
        reject(new Error(error || 'Unknown error'));
      }
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo() {
    return this.sendCommand('GET_ACCOUNT_INFO');
  }

  /**
   * Get account balance
   */
  async getBalance() {
    const info = await this.getAccountInfo();
    return {
      balance: info.balance,
      equity: info.equity,
      margin: info.margin,
      margin_free: info.margin_free,
      profit: info.profit,
    };
  }

  /**
   * Get open positions
   */
  async getPositions() {
    return this.sendCommand('GET_POSITIONS');
  }

  /**
   * Place market order
   * @param {Object} orderData - { symbol, volume, action ('BUY'|'SELL'), type }
   */
  async placeOrder(orderData) {
    const {
      symbol,
      volume,
      action, // BUY or SELL
      type = 'MARKET', // MARKET, LIMIT, STOP, etc.
      price,
      stoploss,
      takeprofit,
      comment = 'Khanyisa Trade',
    } = orderData;

    try {
      const result = await this.sendCommand('PLACE_ORDER', {
        symbol,
        volume,
        action, // MT5 action enum
        type,
        price: price || 0,
        stoploss: stoploss || 0,
        takeprofit: takeprofit || 0,
        comment,
      });

      return result;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Place order with TP and SL levels
   */
  async placeOrderWithLevels(orderData) {
    const {
      symbol,
      volume,
      side, // BUY or SELL
      entry_price,
      stop_loss,
      take_profit,
    } = orderData;

    try {
      const action = side === 'BUY' ? 'BUY' : 'SELL';

      const result = await this.placeOrder({
        symbol,
        volume,
        action,
        type: 'LIMIT',
        price: entry_price,
        stoploss: stop_loss,
        takeprofit: take_profit,
        comment: `Khanyisa Trade - SL: ${stop_loss}, TP: ${take_profit}`,
      });

      return result;
    } catch (error) {
      console.error('Error placing order with levels:', error);
      throw error;
    }
  }

  /**
   * Close position
   */
  async closePosition(ticketId, volume = null) {
    try {
      const result = await this.sendCommand('CLOSE_POSITION', {
        ticket: ticketId,
        volume: volume || null, // null = close all
      });

      return result;
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }

  /**
   * Modify order (SL/TP)
   */
  async modifyOrder(ticketId, stoploss, takeprofit) {
    try {
      const result = await this.sendCommand('MODIFY_ORDER', {
        ticket: ticketId,
        stoploss,
        takeprofit,
      });

      return result;
    } catch (error) {
      console.error('Error modifying order:', error);
      throw error;
    }
  }

  /**
   * Delete pending order
   */
  async deleteOrder(ticketId) {
    try {
      const result = await this.sendCommand('DELETE_ORDER', {
        ticket: ticketId,
      });

      return result;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(dateFrom = null, dateTo = null) {
    try {
      const result = await this.sendCommand('GET_ORDER_HISTORY', {
        date_from: dateFrom,
        date_to: dateTo,
      });

      return result;
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  }

  /**
   * Get symbol info (bid/ask prices)
   */
  async getSymbolInfo(symbol) {
    try {
      const result = await this.sendCommand('GET_SYMBOL_INFO', {
        symbol,
      });

      return result;
    } catch (error) {
      console.error('Error fetching symbol info:', error);
      throw error;
    }
  }

  /**
   * Get rates (OHLC data)
   */
  async getRates(symbol, timeframe = 'H1', count = 100) {
    try {
      // MT5 timeframe: M1, M5, M15, M30, H1, H4, D1, W1, MN1
      const result = await this.sendCommand('GET_RATES', {
        symbol,
        timeframe,
        count,
      });

      return result;
    } catch (error) {
      console.error('Error fetching rates:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MT5
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }
}

export default MT5BrokerService;
