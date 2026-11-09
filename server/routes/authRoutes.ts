import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

// Get list of mock users (Admin and Students)
router.get('/users', (req: Request, res: Response) => {
  const users = db.getUsers();
  res.json({ success: true, data: users });
});

// Get current active user by x-user-id header
router.get('/me', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'admin_1';
  const user = db.getUserById(userId) || db.getUsers()[0];
  res.json({ success: true, data: user });
});

// Get system settings (API Key configured status)
router.get('/settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  const hasKey = Boolean(settings.geminiApiKey && settings.geminiApiKey.trim() !== '');
  res.json({
    success: true,
    data: {
      hasGeminiApiKey: hasKey,
      maskedKey: hasKey ? `${settings.geminiApiKey.slice(0, 4)}...${settings.geminiApiKey.slice(-4)}` : ''
    }
  });
});

// Update settings
router.post('/settings', (req: Request, res: Response) => {
  const { geminiApiKey } = req.body;
  db.saveSettings({ geminiApiKey: geminiApiKey || '' });
  res.json({
    success: true,
    message: 'Pengaturan Gemini API berhasil disimpan.'
  });
});

export default router;
