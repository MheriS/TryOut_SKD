import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { TryoutPackage, PackageVersion, Question, AiGenerationConfig } from '../types.js';
import { generateQuestionsWithAi } from '../services/aiService.js';
import { validatePackageQuestions } from '../services/scoringService.js';

const router = Router();

// Middleware to simulate admin check
router.use((req: Request, res: Response, next) => {
  // In demo environment, admin role is checked or defaulted
  next();
});

// GET /api/admin/packages - List all packages with attempt statistics
router.get('/packages', (req: Request, res: Response) => {
  const packages = db.getPackages();
  const allAttempts = db.getAttempts();

  const packagesWithStats = packages.map(pkg => {
    const activeVersion = pkg.versions.find(v => v.version === pkg.currentVersion) || pkg.versions[pkg.versions.length - 1];
    const totalAttempts = allAttempts.filter(a => a.packageId === pkg.id).length;
    const versionAttempts = allAttempts.filter(a => a.packageId === pkg.id && a.packageVersion === pkg.currentVersion).length;

    return {
      id: pkg.id,
      code: pkg.code,
      title: pkg.title,
      description: pkg.description,
      durationMinutes: pkg.durationMinutes,
      totalQuestions: activeVersion ? activeVersion.questions.length : 0,
      currentVersion: pkg.currentVersion,
      status: activeVersion ? activeVersion.status : 'draft',
      versionCount: pkg.versions.length,
      totalAttempts,
      versionAttempts,
      isLocked: versionAttempts > 0,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt
    };
  });

  res.json({ success: true, data: packagesWithStats });
});

// GET /api/admin/packages/:id - Get full package details including all questions & versions
router.get('/packages/:id', (req: Request, res: Response) => {
  const pkgId = String(req.params.id);
  const pkg = db.getPackageById(pkgId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
  }

  const versionAttempts = db.countAttemptsForVersion(pkg.id, pkg.currentVersion);
  const isLocked = versionAttempts > 0;

  res.json({
    success: true,
    data: {
      ...pkg,
      versionAttempts,
      isLocked
    }
  });
});

// POST /api/admin/packages - Create new package (AI Generated or Manual) (Req 1, 2, 3)
router.post('/packages', async (req: Request, res: Response) => {
  try {
    const {
      code,
      title,
      description,
      durationMinutes = 100,
      passingGrades = { twk: 65, tiu: 80, tkp: 166 },
      generateWithAi = false,
      aiConfig
    } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Judul paket wajib diisi.' });
    }

    // Auto-generate code if not provided
    const packageCount = db.getPackages().length;
    const finalCode = code || `TO-SKD-${String(packageCount + 1).padStart(3, '0')}`;

    // Check duplicate code
    if (db.getPackageByCode(finalCode)) {
      return res.status(400).json({ success: false, message: `Kode paket "${finalCode}" sudah digunakan.` });
    }

    let questions: Question[] = [];
    let generationNote = '';

    if (generateWithAi && aiConfig) {
      console.log(`🚀 Explicit AI Generation triggered by Admin for "${title}"...`);
      const aiResult = await generateQuestionsWithAi({
        packageTitle: title,
        packageCode: finalCode,
        durationMinutes,
        subtests: {
          twk: Number(aiConfig.twk || 5),
          tiu: Number(aiConfig.tiu || 5),
          tkp: Number(aiConfig.tkp || 5)
        },
        difficulty: aiConfig.difficulty || 'Campuran (Standar BKN)',
        specificTopics: aiConfig.specificTopics || '',
        geminiApiKey: aiConfig.geminiApiKey
      });
      questions = aiResult.questions;
      generationNote = aiResult.message;
    }

    const packageId = `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initialVersion: PackageVersion = {
      version: 'v1.0',
      versionNumber: 1,
      status: 'draft',
      changelog: generateWithAi ? 'Dihasilkan oleh AI Generator dan menunggu validasi admin.' : 'Draf paket baru dibuat manual.',
      questions,
      createdAt: new Date().toISOString()
    };

    const newPackage: TryoutPackage = {
      id: packageId,
      code: finalCode,
      title,
      description: description || 'Paket Simulasi Ujian SKD CPNS Terpadu.',
      durationMinutes: Number(durationMinutes) || 100,
      totalQuestions: questions.length,
      passingGrades,
      currentVersion: 'v1.0',
      versions: [initialVersion],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.savePackage(newPackage);

    res.status(201).json({
      success: true,
      message: generationNote || 'Paket tryout berhasil dibuat dalam status draf.',
      data: newPackage
    });
  } catch (err: any) {
    console.error('Error creating package:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal membuat paket tryout.' });
  }
});

// PUT /api/admin/packages/:id - Edit package and questions before publishing (Req 3, 8)
router.put('/packages/:id', (req: Request, res: Response) => {
  const pkgId = String(req.params.id);
  const pkg = db.getPackageById(pkgId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
  }

  const { title, description, durationMinutes, passingGrades, questions, targetVersion } = req.body;
  const versionKey = targetVersion || pkg.currentVersion;

  // STRICT IMMUTABILITY CHECK (Requirement 8)
  const attemptsCount = db.countAttemptsForVersion(pkg.id, versionKey);
  if (attemptsCount > 0) {
    return res.status(403).json({
      success: false,
      message: `Versi ${versionKey} tidak boleh diedit karena sudah memiliki ${attemptsCount} riwayat pengerjaan oleh peserta! Gunakan fitur "Buat Versi Baru" untuk merevisi soal demi menjaga integritas data riwayat.`
    });
  }

  const versionIndex = pkg.versions.findIndex(v => v.version === versionKey);
  if (versionIndex === -1) {
    return res.status(404).json({ success: false, message: `Versi ${versionKey} tidak ditemukan.` });
  }

  // Update metadata
  if (title) pkg.title = title;
  if (description !== undefined) pkg.description = description;
  if (durationMinutes) pkg.durationMinutes = Number(durationMinutes);
  if (passingGrades) pkg.passingGrades = passingGrades;

  // Update questions if provided
  if (Array.isArray(questions)) {
    pkg.versions[versionIndex].questions = questions;
    pkg.totalQuestions = questions.length;
  }

  pkg.updatedAt = new Date().toISOString();
  db.savePackage(pkg);

  res.json({
    success: true,
    message: 'Perubahan paket soal berhasil disimpan secara permanen.',
    data: pkg
  });
});

// POST /api/admin/packages/:id/validate - Run validation checklist on questions (Req 3, 10)
router.post('/packages/:id/validate', (req: Request, res: Response) => {
  const pkgId = String(req.params.id);
  const pkg = db.getPackageById(pkgId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
  }

  const { targetVersion } = req.body;
  const version = pkg.versions.find(v => v.version === (targetVersion || pkg.currentVersion));
  if (!version) {
    return res.status(404).json({ success: false, message: 'Versi tidak ditemukan.' });
  }

  const report = validatePackageQuestions(version.questions);

  // If valid and currently draft, transition to in_review
  if (report.isValid && version.status === 'draft') {
    version.status = 'in_review';
    db.savePackage(pkg);
  }

  res.json({ success: true, data: report });
});

// POST /api/admin/packages/:id/approve - Approve package questions (Req 3, 10)
router.post('/packages/:id/approve', (req: Request, res: Response) => {
  const pkgId = String(req.params.id);
  const pkg = db.getPackageById(pkgId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
  }

  const { targetVersion, approvedBy = 'Administrator' } = req.body;
  const version = pkg.versions.find(v => v.version === (targetVersion || pkg.currentVersion));
  if (!version) {
    return res.status(404).json({ success: false, message: 'Versi tidak ditemukan.' });
  }

  // Validate first
  const report = validatePackageQuestions(version.questions);
  if (!report.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Paket belum lolos validasi. Terdapat butir soal yang belum lengkap atau memiliki kesalahan.',
      report
    });
  }

  version.status = 'approved';
  version.approvedBy = approvedBy;
  pkg.updatedAt = new Date().toISOString();
  db.savePackage(pkg);

  res.json({
    success: true,
    message: `Versi ${version.version} berhasil disetujui (Approved) oleh ${approvedBy}. Siap untuk dipublikasikan.`,
    data: pkg
  });
});

// POST /api/admin/packages/:id/publish - Publish package to students (Req 3, 4, 10)
router.post('/packages/:id/publish', (req: Request, res: Response) => {
  const pkgId = String(req.params.id);
  const pkg = db.getPackageById(pkgId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
  }

  const { targetVersion } = req.body;
  const version = pkg.versions.find(v => v.version === (targetVersion || pkg.currentVersion));
  if (!version) {
    return res.status(404).json({ success: false, message: 'Versi tidak ditemukan.' });
  }

  const report = validatePackageQuestions(version.questions);
  if (!report.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Tidak dapat memublikasikan paket karena validasi soal gagal.',
      report
    });
  }

  version.status = 'published';
  version.publishedAt = new Date().toISOString();
  pkg.currentVersion = version.version;
  pkg.updatedAt = new Date().toISOString();
  db.savePackage(pkg);

  res.json({
    success: true,
    message: `Paket "${pkg.title}" (${version.version}) berhasil dipublikasikan! Seluruh peserta sekarang dapat mengakses soal ini secara seragam dan terpusat.`,
    data: pkg
  });
});

// POST /api/admin/packages/:id/archive - Archive package (Req 10)
router.post('/packages/:id/archive', (req: Request, res: Response) => {
  const pkgId = String(req.params.id);
  const pkg = db.getPackageById(pkgId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
  }

  const version = pkg.versions.find(v => v.version === pkg.currentVersion);
  if (version) {
    version.status = 'archived';
  }
  pkg.updatedAt = new Date().toISOString();
  db.savePackage(pkg);

  res.json({
    success: true,
    message: `Paket "${pkg.title}" berhasil diarsipkan.`,
    data: pkg
  });
});

// POST /api/admin/packages/:id/restore - Restore archived package (Req 10)
router.post('/packages/:id/restore', (req: Request, res: Response) => {
  const pkgId = String(req.params.id);
  const pkg = db.getPackageById(pkgId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
  }

  const version = pkg.versions.find(v => v.version === pkg.currentVersion);
  if (version) {
    version.status = 'published';
  }
  pkg.updatedAt = new Date().toISOString();
  db.savePackage(pkg);

  res.json({
    success: true,
    message: `Paket "${pkg.title}" berhasil dipulihkan kembali ke status aktif publikasi.`,
    data: pkg
  });
});

// POST /api/admin/packages/:id/new-version - Create a new immutable version (Req 8, 10)
router.post('/packages/:id/new-version', (req: Request, res: Response) => {
  const pkgId = String(req.params.id);
  const pkg = db.getPackageById(pkgId);
  if (!pkg) {
    return res.status(404).json({ success: false, message: 'Paket tidak ditemukan.' });
  }

  const { changelog } = req.body;
  const currentVer = pkg.versions.find(v => v.version === pkg.currentVersion) || pkg.versions[pkg.versions.length - 1];

  const nextVerNumber = pkg.versions.length + 1;
  const nextVerString = `v${nextVerNumber}.0`;

  // Deep clone current questions to new version
  const clonedQuestions: Question[] = JSON.parse(JSON.stringify(currentVer.questions));

  const newVersion: PackageVersion = {
    version: nextVerString,
    versionNumber: nextVerNumber,
    status: 'draft',
    changelog: changelog || `Pembaruan revisi paket dari ${currentVer.version}.`,
    questions: clonedQuestions,
    createdAt: new Date().toISOString()
  };

  pkg.versions.push(newVersion);
  pkg.currentVersion = nextVerString;
  pkg.updatedAt = new Date().toISOString();
  db.savePackage(pkg);

  res.json({
    success: true,
    message: `Versi baru (${nextVerString}) berhasil dibuat dalam status Draf. Riwayat pengerjaan versi sebelumnya (${currentVer.version}) tetap terlindungi secara permanen.`,
    data: pkg
  });
});

// DELETE /api/admin/packages/:id - Delete package (only if no attempts exist)
router.delete('/packages/:id', (req: Request, res: Response) => {
  try {
    const pkgId = String(req.params.id);
    db.deletePackage(pkgId);
    res.json({ success: true, message: 'Paket berhasil dihapus.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Gagal menghapus paket.' });
  }
});

export default router;
