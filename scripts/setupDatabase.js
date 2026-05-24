import { pool } from '../db/database.js';

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  account_balance DECIMAL(15, 2) DEFAULT 50000.00,
  daily_loss_limit DECIMAL(15, 2) DEFAULT 1000.00,
  max_position_size DECIMAL(5, 2) DEFAULT 10.00,
  max_risk_per_trade DECIMAL(5, 2) DEFAULT 2.00,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair VARCHAR(20) NOT NULL,
  signal_type VARCHAR(10) NOT NULL,
  entry_price DECIMAL(15, 8) NOT NULL,
  stop_loss DECIMAL(15, 8) NOT NULL,
  take_profit DECIMAL(15, 8) NOT NULL,
  position_size DECIMAL(15, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_approval',
  confidence DECIMAL(5, 2),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade execution history
CREATE TABLE IF NOT EXISTS trade_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_price DECIMAL(15, 8),
  profit_loss DECIMAL(15, 8),
  profit_loss_percentage DECIMAL(10, 2),
  status VARCHAR(50),
  notes TEXT
);

-- Risk metrics
CREATE TABLE IF NOT EXISTS risk_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_pnl DECIMAL(15, 2),
  total_open_positions DECIMAL(15, 2),
  total_exposure DECIMAL(15, 2),
  max_drawdown DECIMAL(10, 2),
  win_rate DECIMAL(5, 2),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance statistics
CREATE TABLE IF NOT EXISTS performance_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  losing_trades INT DEFAULT 0,
  total_profit_loss DECIMAL(15, 2),
  total_return_percentage DECIMAL(10, 2),
  best_trade DECIMAL(15, 2),
  worst_trade DECIMAL(15, 2),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading signals
CREATE TABLE IF NOT EXISTS trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pair VARCHAR(20) NOT NULL,
  signal_type VARCHAR(10) NOT NULL,
  technical_indicators JSONB,
  confidence DECIMAL(5, 2),
  recommendation VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_trade_executions_trade_id ON trade_executions(trade_id);
CREATE INDEX IF NOT EXISTS idx_risk_metrics_user_id ON risk_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_stats_user_id ON performance_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_user_id ON trading_signals(user_id);
`;

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database schema...');
    
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }

    console.log('✅ Database schema created successfully!');
    console.log('\n📊 Tables created:');
    console.log('   - users');
    console.log('   - trades');
    console.log('   - trade_executions');
    console.log('   - risk_metrics');
    console.log('   - performance_stats');
    console.log('   - trading_signals');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
