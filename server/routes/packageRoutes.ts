import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

// Get all published packages available for students
router.get('/', (req: Request, res: Response) => {
  const packages = db.getPackages();
  const userId = (req.headers['x-user-id'] as string) || '';

  // Filter only published packages
  const published = packages
    .filter(pkg => {
      const activeVersion = pkg.versions.find(v => v.version === pkg.currentVersion);
      return activeVersion && activeVersion.status === 'published';
    })
    .map(pkg => {
      const activeVersion = pkg.versions.find(v => v.version === pkg.currentVersion)!;
      // Get user attempts for this package to show past score and attempt count
      const userAttempts = userId ? db.getUserAttemptsForPackage(userId, pkg.id) : [];
      const completedAttempts = userAttempts.filter(a => a.status === 'completed');
      const latestAttempt = completedAttempts[completedAttempts.length - 1];

      return {
        id: pkg.id,
        code: pkg.code,
        title: pkg.title,
        description: pkg.description,
        durationMinutes: pkg.durationMinutes,
        totalQuestions: activeVersion.questions.length,
        passingGrades: pkg.passingGrades,
        currentVersion: pkg.currentVersion,
        publishedAt: activeVersion.publishedAt,
        attemptCount: completedAttempts.length,
        latestScore: latestAttempt?.scores?.totalScore,
        latestPassed: latestAttempt?.scores?.isPassedAll
      };
    });

  res.json({ success: true, data: published });
});

// Get package detail by ID
router.get('/:id', (req: Request, res: Response) => {
  const pkgId = String(req.params.id);
  const pkg = db.getPackageById(pkgId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tryout tidak ditemukan.' });
  }

  const activeVersion = pkg.versions.find(v => v.version === pkg.currentVersion);
  if (!activeVersion || activeVersion.status !== 'published') {
    return res.status(403).json({ success: false, message: 'Paket ini belum dipublikasikan.' });
  }

  // Count subtests
  const twkCount = activeVersion.questions.filter(q => q.subtest === 'TWK').length;
  const tiuCount = activeVersion.questions.filter(q => q.subtest === 'TIU').length;
  const tkpCount = activeVersion.questions.filter(q => q.subtest === 'TKP').length;

  res.json({
    success: true,
    data: {
      id: pkg.id,
      code: pkg.code,
      title: pkg.title,
      description: pkg.description,
      durationMinutes: pkg.durationMinutes,
      totalQuestions: activeVersion.questions.length,
      subtestBreakdown: { twk: twkCount, tiu: tiuCount, tkp: tkpCount },
      passingGrades: pkg.passingGrades,
      currentVersion: pkg.currentVersion,
      publishedAt: activeVersion.publishedAt
    }
  });
});

export default router;
