import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { seedInitialData } from './db/seed.js';
import authRoutes from './routes/authRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import attemptRoutes from './routes/attemptRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Seed initial packages and mock data if clean state
seedInitialData();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CAT SKD CPNS Centralized Question Generation System',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if exists
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CAT SKD Backend API Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔒 Anti-Cheat & Centralized AI Rules: ACTIVE`);
  console.log(`====================================================`);
});
