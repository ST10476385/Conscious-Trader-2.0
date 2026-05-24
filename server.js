import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/database.js';
import authRoutes from './routes/auth.js';
import tradeRoutes from './routes/trades.js';
import performanceRoutes from './routes/performance.js';
import { setupMT5Routes } from './routes/mt5.js';
import aiTradeRoutes from './routes/aiTrade.js';

const envFilePath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envFilePath });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/', aiTradeRoutes);

// MT5 Bridge webhooks
setupMT5Routes(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// Start server
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Khanyisa Backend Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 MT5 Account: http://localhost:${PORT}/api/mt5/account\n`);
  });

  // Test database connection in background
  try {
    const result = await pool`SELECT NOW()`;
    console.log('✅ Database connected:', result[0].now);
  } catch (error) {
    console.warn('⚠️  Database connection not available:', error.message);
  }
};

startServer();
