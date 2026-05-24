/**
 * Unified Broker Service
 * Abstraction layer for multiple brokers
 * Currently supports: Alpaca, MetaTrader 5
 */

import AlpacaBrokerService from './alpacaBroker.js';
import MT5BrokerService from './mt5Broker.js';

class UnifiedBrokerService {
  constructor(brokerType = 'alpaca', config = {}) {
    this.brokerType = brokerType;
    this.config = config;
    this.broker = null;
    this.isConnected = false;

    this.initialize();
  }

  /**
   * Initialize broker instance
   */
  initialize() {
    if (this.brokerType === 'alpaca') {
      const { apiKey, apiSecret, isLiveTrading } = this.config;
      this.broker = new AlpacaBrokerService(apiKey, apiSecret, isLiveTrading);
    } else if (this.brokerType === 'mt5') {
      const { brokerServer, account, password, server } = this.config;
      this.broker = new MT5BrokerService(brokerServer, account, password, server);
    } else {
      throw new Error(`Unknown broker type: ${this.brokerType}`);
    }
  }

  /**
   * Connect to broker
   */
  async connect() {
    try {
      if (this.brokerType === 'mt5') {
        await this.broker.connect();
      }
      this.isConnected = true;
      console.log(`Connected to ${this.brokerType} broker`);
    } catch (error) {
      console.error(`Failed to connect to ${this.brokerType}:`, error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    return this.broker.getBalance();
  }

  /**
   * Get open positions
   */
  async getPositions() {
    return this.broker.getPositions();
  }

  /**
   * Place order
   */
  async placeOrder(orderData) {
    const {
      pair,
      side, // BUY/SELL
      volume,
      type = 'market',
      price,
    } = orderData;

    // Convert pair to broker symbol
    const symbol = this.convertPairToSymbol(pair);

    try {
      const result = await this.broker.placeOrder({
        symbol,
        volume,
        side: side.toUpperCase(),
        type: type.toUpperCase(),
        price,
      });

      return {
        status: 'success',
        orderId: result.ticket || result.id,
        data: result,
      };
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Place order with stop loss and take profit
   */
  async placeOrderWithLevels(tradeData) {
    const {
      pair,
      side,
      volume,
      entryPrice,
      stopLoss,
      takeProfitPrice,
    } = tradeData;

    const symbol = this.convertPairToSymbol(pair);

    try {
      const result = await this.broker.placeOrderWithLevels({
        symbol,
        volume,
        side: side.toUpperCase(),
        entry_price: entryPrice,
        stop_loss: stopLoss,
        take_profit: takeProfitPrice,
      });

      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      console.error('Error placing order with levels:', error);
      throw error;
    }
  }

  /**
   * Close position
   */
  async closePosition(positionId, volume = null) {
    try {
      const result = await this.broker.closePosition(positionId, volume);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(options = {}) {
    return this.broker.getOrderHistory(options);
  }

  /**
   * Convert trading pair to broker symbol
   * EUR/USD → EURUSD, BTC/USD → BTCUSD, etc.
   */
  convertPairToSymbol(pair) {
    if (!pair) return pair;

    // Remove slash if present
    const symbol = pair.replace('/', '');

    // Add .USD suffix for stocks if broker requires
    if (this.brokerType === 'alpaca' && !symbol.includes('.')) {
      if (['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'].includes(symbol)) {
        return symbol; // Alpaca uses plain symbol for stocks
      }
    }

    return symbol;
  }

  /**
   * Get broker status
   */
  getStatus() {
    return {
      broker: this.brokerType,
      isConnected: this.isConnected,
      type: this.brokerType === 'mt5' ? 'MetaTrader5' : 'Alpaca',
    };
  }

  /**
   * Disconnect from broker
   */
  disconnect() {
    if (this.brokerType === 'mt5' && this.broker) {
      this.broker.disconnect();
    }
    this.isConnected = false;
  }
}

export default UnifiedBrokerService;
