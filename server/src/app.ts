import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import recipeRoutes from './routes/recipe.routes';
import uploadRoutes from './routes/upload.routes';
import shoppingListRoutes from './routes/shoppingList.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving images cross-origin
  })
);

// CORS — strict allow-list
app.use(
  cors({
    origin: config.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// General rate limit (bypassed in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Serve uploaded images statically
app.use(
  '/uploads',
  express.static(path.resolve(config.UPLOAD_DIR), {
    maxAge: '7d',
    dotfiles: 'deny',
  })
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/shopping-list', shoppingListRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

export default app;
