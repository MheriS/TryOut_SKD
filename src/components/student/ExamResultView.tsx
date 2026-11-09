import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { ReviewData, ReviewQuestion, Subtest } from '../../types';
import {
  Award,
  CheckCircle,
  XCircle,
  RotateCcw,
  BookOpen,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
  X,
  HelpCircle,
  ShieldCheck,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface ExamResultViewProps {
  attemptId: string;
  onRetake: (packageId: string) => void;
  onBackToCatalog: () => void;
  onViewHistory: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  attemptId,
  onRetake,
  onBackToCatalog,
  onViewHistory
}) => {
  const [data, setData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'DOUBTFUL' | Subtest>('ALL');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadReview = async () => {
      try {
        setIsLoading(true);
        setErrorMsg('');
        const res = await api.getAttemptReview(attemptId);
        setData(res);

        // If passed, trigger celebratory confetti!
        if (res.attempt.scores?.isPassedAll) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (err: any) {
        console.error('Failed to load review:', err);
        setErrorMsg(err.message || 'Gagal memuat hasil ujian.');
      } finally {
        setIsLoading(false);
      }
    };

    loadReview();
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-base font-bold text-slate-800">Menghitung Hasil dan Membuka Kunci Pembahasan...</h3>
        <p className="text-xs text-slate-400 mt-1">Mengambil pembahasan resmi dari database terpusat.</p>
      </div>
    );
  }

  if (!data || errorMsg) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          {errorMsg || 'Hasil ujian tidak dapat dimuat.'}
        </div>
        <button
          onClick={onBackToCatalog}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const { attempt, package: pkg, questions } = data;
  const scores = attempt.scores!;
  const isPassed = scores.isPassedAll;

  // Toggle question accordion
  const toggleExpand = (qId: string) => {
    setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CORRECT') return q.isCorrect;
    if (activeFilter === 'WRONG') return !q.isCorrect && q.candidateAnswer !== null;
    if (activeFilter === 'DOUBTFUL') return q.isDoubtful;
    if (activeFilter === 'TWK') return q.subtest === 'TWK';
    if (activeFilter === 'TIU') return q.subtest === 'TIU';
    if (activeFilter === 'TKP') return q.subtest === 'TKP';
    return true;
  });

  const durationMin = Math.floor((attempt.durationSeconds || 0) / 60);
  const durationSec = (attempt.durationSeconds || 0) % 60;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Tryout</span>
        </button>

        <span className="font-mono text-xs text-slate-400">
          ID Pengerjaan: {attempt.id}
        </span>
      </div>

      {/* Hero Pass / Fail Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden ${
          isPassed
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800'
            : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-800'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-sm">
              <Award className="w-4 h-4 text-amber-300" />
              <span>Simulasi SKD CPNS 2026</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isPassed
                ? 'SELAMAT! ANDA MEMENUHI PASSING GRADE'
                : 'BELUM MEMENUHI PASSING GRADE'}
            </h1>

            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              {isPassed
                ? `Selamat, ${attempt.userDisplayName}! Anda berhasil melampaui seluruh nilai ambang batas subtes TWK, TIU, dan TKP secara serentak.`
                : `Tetap semangat, ${attempt.userDisplayName}! Anda belum melampaui nilai ambang batas pada salah satu subtes. Pelajari pembahasan di bawah dan coba kembali.`}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-white/80">
              <span>Paket: <strong>{pkg.title}</strong></span>
              <span>•</span>
              <span>Versi: <strong>{attempt.packageVersion}</strong></span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-white/20 font-bold">
                Percobaan #{attempt.attemptNumber}
              </span>
            </div>
          </div>

          {/* Big Total Score Display */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center min-w-[170px] shrink-0">
            <span className="text-[11px] uppercase font-bold text-white/80 tracking-wider">Total Skor</span>
            <div className="text-4xl sm:text-5xl font-black text-white mt-1">
              {scores.totalScore}
            </div>
            <span className="text-[11px] text-white/70 mt-1 block">Maksimal: 550</span>
          </div>
        </div>
      </div>

      {/* Subtests Score Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TWK Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">TWK (Wawasan)</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                scores.twkPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {scores.twkPassed ? 'MEMENUHI' : 'BELUM MEMENUHI'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-slate-900">{scores.twkScore}</div>
            <span className="text-xs text-slate-400 font-semibold">/ Min 65</span>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Benar: <strong>{scores.twkCorrectCount}</strong> butir</span>
            <span>Passing Grade: <strong>65</strong></span>
          </div>
        </div>

        {/* TIU Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">TIU (Inteligensia)</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                scores.tiuPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {scores.tiuPassed ? 'MEMENUHI' : 'BELUM MEMENUHI'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-slate-900">{scores.tiuScore}</div>
            <span className="text-xs text-slate-400 font-semibold">/ Min 80</span>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Benar: <strong>{scores.tiuCorrectCount}</strong> butir</span>
            <span>Passing Grade: <strong>80</strong></span>
          </div>
        </div>

        {/* TKP Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">TKP (Karakteristik)</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                scores.tkpPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {scores.tkpPassed ? 'MEMENUHI' : 'BELUM MEMENUHI'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-slate-900">{scores.tkpScore}</div>
            <span className="text-xs text-slate-400 font-semibold">/ Min 166</span>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Skala Poin: <strong>1 - 5 per opsi</strong></span>
            <span>Passing Grade: <strong>166</strong></span>
          </div>
        </div>
      </div>

      {/* Retake & Action Bar (Requirement 7) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>
            Waktu Pengerjaan: <strong>{durationMin} menit {durationSec} detik</strong>
          </span>
          <span>•</span>
          <span>
            Selesai pada: <strong>{new Date(attempt.submittedAt || '').toLocaleString('id-ID')}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onRetake(pkg.id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kerjakan Ulang Paket Ini</span>
          </button>

          <button
            onClick={onViewHistory}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
          >
            Lihat Riwayat Lengkap
          </button>
        </div>
      </div>

      {/* Pembahasan & Review Section (Requirement 9) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Pembahasan Resmi Butir Soal</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kunci jawaban dan pembahasan resmi terpusat dibuka secara otomatis setelah ujian diselesaikan.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua ({questions.length})
            </button>
            <button
              onClick={() => setActiveFilter('CORRECT')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeFilter === 'CORRECT' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Benar ({questions.filter(q => q.isCorrect).length})
            </button>
            <button
              onClick={() => setActiveFilter('WRONG')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeFilter === 'WRONG' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              Salah ({questions.filter(q => !q.isCorrect && q.candidateAnswer !== null).length})
            </button>
            <button
              onClick={() => setActiveFilter('TWK')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeFilter === 'TWK' ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              TWK
            </button>
            <button
              onClick={() => setActiveFilter('TIU')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeFilter === 'TIU' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              TIU
            </button>
            <button
              onClick={() => setActiveFilter('TKP')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                activeFilter === 'TKP' ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              TKP
            </button>
          </div>
        </div>

        {/* Questions Accordion List */}
        <div className="space-y-4">
          {filteredQuestions.map(q => {
            const isExpanded = expandedQuestions[q.id] !== false; // expanded by default

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(q.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {q.number}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        q.subtest === 'TWK'
                          ? 'bg-red-100 text-red-800'
                          : q.subtest === 'TIU'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {q.subtest}
                    </span>

                    <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                      {q.topic}
                    </span>

                    {/* Result Pill */}
                    {q.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>+{q.earnedPoints} Poin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        <X className="w-3 h-3 text-red-600" />
                        <span>+{q.earnedPoints} Poin</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">
                      Jawaban Anda: <strong className="text-slate-800">{q.candidateAnswer || 'Kosong'}</strong>
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-slate-100 space-y-4">
                    {/* Question text */}
                    <div className="text-sm text-slate-900 leading-relaxed font-medium pt-3 whitespace-pre-line">
                      {q.question}
                    </div>

                    {/* Options list */}
                    <div className="space-y-2">
                      {(['A', 'B', 'C', 'D', 'E'] as Array<'A' | 'B' | 'C' | 'D' | 'E'>).map(optKey => {
                        const isCandidateChoice = q.candidateAnswer === optKey;
                        const isCorrectKey = q.subtest !== 'TKP' && q.correctAnswer === optKey;
                        const tkpScore = q.tkpScores ? q.tkpScores[optKey] : undefined;

                        let style = 'bg-slate-50 border-slate-200 text-slate-700';
                        if (isCorrectKey) {
                          style = 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400 text-emerald-950 font-semibold';
                        } else if (isCandidateChoice && !isCorrectKey && q.subtest !== 'TKP') {
                          style = 'bg-red-50 border-red-300 ring-1 ring-red-400 text-red-950 font-semibold';
                        } else if (q.subtest === 'TKP' && isCandidateChoice) {
                          style = 'bg-purple-50 border-purple-400 ring-1 ring-purple-400 text-purple-950 font-semibold';
                        }

                        return (
                          <div
                            key={optKey}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs leading-relaxed ${style}`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-md bg-white border font-bold flex items-center justify-center shrink-0">
                                {optKey}
                              </span>
                              <span className="pt-0.5">{q.options[optKey]}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isCandidateChoice && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-[10px]">
                                  Pilihan Anda
                                </span>
                              )}
                              {isCorrectKey && (
                                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                                  Kunci Benar (+5)
                                </span>
                              )}
                              {tkpScore !== undefined && (
                                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px] border border-purple-200">
                                  Bobot: {tkpScore} Poin
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-700" />
                        <span>Pembahasan Analisis:</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-line pl-5">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
