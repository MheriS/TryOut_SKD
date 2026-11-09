import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/dashboard', (req: Request, res: Response) => {
  const packages = db.getPackages();
  const attempts = db.getAttempts();
  const users = db.getUsers();

  const completedAttempts = attempts.filter(a => a.status === 'completed');
  const totalAttempts = attempts.length;

  // Passing statistics
  const passedAttempts = completedAttempts.filter(a => a.scores?.isPassedAll);
  const passingRate = completedAttempts.length > 0
    ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
    : 0;

  // Average scores
  let avgTwk = 0;
  let avgTiu = 0;
  let avgTkp = 0;
  let avgTotal = 0;

  if (completedAttempts.length > 0) {
    const sum = completedAttempts.reduce(
      (acc, a) => {
        acc.twk += a.scores?.twkScore || 0;
        acc.tiu += a.scores?.tiuScore || 0;
        acc.tkp += a.scores?.tkpScore || 0;
        acc.total += a.scores?.totalScore || 0;
        return acc;
      },
      { twk: 0, tiu: 0, tkp: 0, total: 0 }
    );
    avgTwk = Math.round(sum.twk / completedAttempts.length);
    avgTiu = Math.round(sum.tiu / completedAttempts.length);
    avgTkp = Math.round(sum.tkp / completedAttempts.length);
    avgTotal = Math.round(sum.total / completedAttempts.length);
  }

  // Count packages by status
  let publishedCount = 0;
  let draftCount = 0;
  let inReviewCount = 0;
  let archivedCount = 0;

  packages.forEach(pkg => {
    const activeVer = pkg.versions.find(v => v.version === pkg.currentVersion);
    if (!activeVer) return;
    if (activeVer.status === 'published') publishedCount++;
    else if (activeVer.status === 'draft') draftCount++;
    else if (activeVer.status === 'in_review') inReviewCount++;
    else if (activeVer.status === 'archived') archivedCount++;
  });

  // Recent attempts
  const recentAttempts = [...attempts]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 8);

  res.json({
    success: true,
    data: {
      stats: {
        totalPackages: packages.length,
        publishedPackages: publishedCount,
        draftPackages: draftCount,
        inReviewPackages: inReviewCount,
        archivedPackages: archivedCount,
        totalParticipants: users.filter(u => u.role === 'user').length,
        totalAttempts,
        completedAttempts: completedAttempts.length,
        passingRate,
        averageScores: {
          twk: avgTwk,
          tiu: avgTiu,
          tkp: avgTkp,
          total: avgTotal
        }
      },
      recentAttempts
    }
  });
});

export default router;
