import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import paymentsRoutes from './routes/payments.js';
import invoicesRoutes from './routes/invoices.js';
import dashboardRoutes from './routes/dashboard.js';
import voiceRoutes from './routes/voice.js';
import whatsappRoutes from './routes/whatsapp.js';
import vendorRoutes from './routes/vendor.js';
import salesRoutes from './routes/sales.js';

import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Vyapaar AI Backend'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Vyapaar AI API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      docs: '/api-docs'
    }
  });
});

app.use('/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/sales', salesRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Vyapaar AI Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash the server
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  // Don't crash the server
});

export default app;


