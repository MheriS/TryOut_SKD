import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { UserAttempt, Question } from '../types.js';
import { sanitizeQuestionsForExam, evaluateAttempt } from '../services/scoringService.js';

const router = Router();

// POST /api/attempts/start - Start a tryout attempt (Req 4, 5, 6, 7)
// ZERO AI calls! Fetches identical questions from DB.
router.post('/start', (req: Request, res: Response) => {
  const { packageId, userId: bodyUserId } = req.body;
  const userId = bodyUserId || (req.headers['x-user-id'] as string) || 'user_1';

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Data peserta tidak ditemukan.' });
  }

  const pkg = db.getPackageById(packageId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tryout tidak ditemukan.' });
  }

  const activeVersion = pkg.versions.find(v => v.version === pkg.currentVersion);
  if (!activeVersion || activeVersion.status !== 'published') {
    return res.status(400).json({ success: false, message: 'Paket tryout ini belum dipublikasikan.' });
  }

  // Count past attempts by this user for this package (Req 6 & 7)
  const pastAttempts = db.getUserAttemptsForPackage(userId, packageId);
  const attemptNumber = pastAttempts.length + 1;

  const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newAttempt: UserAttempt = {
    id: attemptId,
    userId: user.id,
    userDisplayName: user.name,
    packageId: pkg.id,
    packageCode: pkg.code,
    packageTitle: pkg.title,
    packageVersion: activeVersion.version,
    attemptNumber,
    startedAt: new Date().toISOString(),
    durationSeconds: 0,
    status: 'in_progress',
    answers: {}
  };

  db.saveAttempt(newAttempt);

  res.status(201).json({
    success: true,
    data: {
      attemptId: newAttempt.id,
      packageId: pkg.id,
      packageCode: pkg.code,
      packageTitle: pkg.title,
      packageVersion: activeVersion.version,
      attemptNumber: newAttempt.attemptNumber,
      durationMinutes: pkg.durationMinutes,
      totalQuestions: activeVersion.questions.length
    }
  });
});

// GET /api/attempts/:id/questions - Fetch questions for exam
// CRITICAL (Req 9): SANITIZED! Absolutely NO correctAnswer, NO tkpScores, NO explanation!
router.get('/:id/questions', (req: Request, res: Response) => {
  const attemptId = String(req.params.id);
  const attempt = db.getAttemptById(attemptId);
  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Sesi pengerjaan tidak ditemukan.' });
  }

  const pkg = db.getPackageById(attempt.packageId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tryout terkait tidak ditemukan.' });
  }

  const version = pkg.versions.find(v => v.version === attempt.packageVersion);
  if (!version) {
    return res.status(404).json({ success: false, message: 'Versi soal terkait tidak ditemukan.' });
  }

  // Strip answer keys and explanations before sending to client (Req 9)
  const sanitizedQuestions = sanitizeQuestionsForExam(version.questions);

  const totalTimeSeconds = pkg.durationMinutes * 60;
  const remainingSeconds = Math.max(0, totalTimeSeconds - (attempt.durationSeconds || 0));

  res.json({
    success: true,
    data: {
      attempt: {
        id: attempt.id,
        packageId: attempt.packageId,
        packageCode: attempt.packageCode,
        packageTitle: attempt.packageTitle,
        packageVersion: attempt.packageVersion,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        durationSeconds: attempt.durationSeconds,
        answers: attempt.answers
      },
      durationMinutes: pkg.durationMinutes,
      remainingSeconds,
      passingGrades: pkg.passingGrades,
      questions: sanitizedQuestions
    }
  });
});

// PUT /api/attempts/:id/save - Auto-save candidate progress
router.put('/:id/save', (req: Request, res: Response) => {
  const attemptId = String(req.params.id);
  const attempt = db.getAttemptById(attemptId);
  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Sesi pengerjaan tidak ditemukan.' });
  }

  if (attempt.status === 'completed') {
    return res.status(400).json({ success: false, message: 'Ujian ini sudah diselesaikan dan tidak dapat diubah.' });
  }

  const { answers, durationSeconds } = req.body;
  if (answers && typeof answers === 'object') {
    attempt.answers = answers;
  }
  if (typeof durationSeconds === 'number') {
    attempt.durationSeconds = durationSeconds;
  }

  db.saveAttempt(attempt);
  res.json({ success: true, message: 'Progres jawaban berhasil disimpan di server.' });
});

// POST /api/attempts/:id/submit - Submit exam and grade server-side (Req 6, 9)
router.post('/:id/submit', (req: Request, res: Response) => {
  const attemptId = String(req.params.id);
  const attempt = db.getAttemptById(attemptId);
  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Sesi pengerjaan tidak ditemukan.' });
  }

  if (attempt.status === 'completed') {
    return res.json({
      success: true,
      message: 'Ujian sudah diselesaikan sebelumnya.',
      data: attempt
    });
  }

  const pkg = db.getPackageById(attempt.packageId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tryout tidak ditemukan.' });
  }

  const version = pkg.versions.find(v => v.version === attempt.packageVersion);
  if (!version) {
    return res.status(404).json({ success: false, message: 'Versi soal tidak ditemukan.' });
  }

  // Update answers from payload if provided
  if (req.body.answers) {
    attempt.answers = req.body.answers;
  }
  if (req.body.durationSeconds !== undefined) {
    attempt.durationSeconds = req.body.durationSeconds;
  }

  // SERVER-SIDE GRADING with exact keys from DB (Req 9)
  const scoreBreakdown = evaluateAttempt(version.questions, attempt.answers, pkg.passingGrades);

  attempt.scores = scoreBreakdown;
  attempt.status = 'completed';
  attempt.submittedAt = new Date().toISOString();

  db.saveAttempt(attempt);

  res.json({
    success: true,
    message: 'Tryout berhasil diselesaikan dan dinilai.',
    data: {
      attemptId: attempt.id,
      scores: scoreBreakdown,
      attemptNumber: attempt.attemptNumber
    }
  });
});

// GET /api/attempts/:id/review - Post-submission review with keys & explanations (Req 9)
// ACCESSIBLE ONLY AFTER SUBMISSION!
router.get('/:id/review', (req: Request, res: Response) => {
  const attemptId = String(req.params.id);
  const attempt = db.getAttemptById(attemptId);
  if (!attempt) {
    return res.status(404).json({ success: false, message: 'Riwayat pengerjaan tidak ditemukan.' });
  }

  // Security gate: Cannot peek answers before submission
  if (attempt.status !== 'completed') {
    return res.status(403).json({
      success: false,
      message: 'Kunci jawaban dan pembahasan belum dapat diakses sebelum ujian selesai diserahkan.'
    });
  }

  const pkg = db.getPackageById(attempt.packageId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tryout tidak ditemukan.' });
  }

  const version = pkg.versions.find(v => v.version === attempt.packageVersion);
  if (!version) {
    return res.status(404).json({ success: false, message: 'Versi soal tidak ditemukan.' });
  }

  // Build annotated questions with candidate's choice, correct key, points earned, and explanation
  const reviewQuestions = version.questions.map(q => {
    const candidateAns = attempt.answers[q.id]?.selectedOption || null;
    let earnedPoints = 0;
    let isCorrect = false;

    if (q.subtest === 'TWK' || q.subtest === 'TIU') {
      if (candidateAns && candidateAns === q.correctAnswer) {
        earnedPoints = 5;
        isCorrect = true;
      }
    } else if (q.subtest === 'TKP') {
      if (candidateAns && q.tkpScores && q.tkpScores[candidateAns] !== undefined) {
        earnedPoints = q.tkpScores[candidateAns];
        isCorrect = earnedPoints === 5;
      }
    }

    return {
      id: q.id,
      number: q.number,
      subtest: q.subtest,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      tkpScores: q.tkpScores,
      explanation: q.explanation,
      candidateAnswer: candidateAns,
      earnedPoints,
      isCorrect,
      isDoubtful: Boolean(attempt.answers[q.id]?.isDoubtful)
    };
  });

  res.json({
    success: true,
    data: {
      attempt,
      package: {
        id: pkg.id,
        code: pkg.code,
        title: pkg.title,
        durationMinutes: pkg.durationMinutes,
        passingGrades: pkg.passingGrades
      },
      questions: reviewQuestions
    }
  });
});

// GET /api/attempts/user/:userId - Get all attempts for a user (Req 6, 7)
router.get('/user/:userId', (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const attempts = db.getUserAttempts(userId);
  // Sort descending by startedAt
  attempts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  res.json({ success: true, data: attempts });
});

// GET /api/attempts/package/:packageId - Admin participant monitoring (Req 6, 10)
router.get('/package/:packageId', (req: Request, res: Response) => {
  const packageId = String(req.params.packageId);
  const allAttempts = db.getAttempts();
  const packageAttempts = allAttempts
    .filter(a => a.packageId === packageId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  res.json({ success: true, data: packageAttempts });
});

export default router;
