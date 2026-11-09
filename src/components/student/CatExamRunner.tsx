import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SanitizedQuestion, UserAnswer, Subtest } from '../../types';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  BookmarkCheck,
  Loader2,
  Save
} from 'lucide-react';

interface CatExamRunnerProps {
  attemptId: string;
  onFinishExam: (attemptId: string) => void;
  onExit: () => void;
}

export const CatExamRunner: React.FC<CatExamRunnerProps> = ({
  attemptId,
  onFinishExam,
  onExit
}) => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState<SanitizedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(6000);
  const [packageTitle, setPackageTitle] = useState('');
  const [packageCode, setPackageCode] = useState('');
  const [packageVersion, setPackageVersion] = useState('');
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [activeSubtestTab, setActiveSubtestTab] = useState<'ALL' | Subtest>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const remainingSecondsRef = useRef(remainingSeconds);
  remainingSecondsRef.current = remainingSeconds;

  // Load Exam Data
  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        const data = await api.getAttemptQuestions(attemptId);
        setQuestions(data.questions);
        setAnswers(data.attempt.answers || {});
        setRemainingSeconds(data.remainingSeconds);
        setPackageTitle(data.attempt.packageTitle);
        setPackageCode(data.attempt.packageCode);
        setPackageVersion(data.attempt.packageVersion);
        setAttemptNumber(data.attempt.attemptNumber);
      } catch (err: any) {
        console.error('Failed to load exam:', err);
        setErrorMsg(err.message || 'Gagal memuat soal ujian.');
      } finally {
        setIsLoading(false);
      }
    };
    loadExam();
  }, [attemptId]);

  // Timer countdown
  useEffect(() => {
    if (isLoading || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit when time expires!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Auto-save interval to server every 15 seconds
  useEffect(() => {
    if (isLoading || questions.length === 0) return;

    const saveInterval = setInterval(async () => {
      try {
        await api.saveAttemptProgress(
          attemptId,
          answersRef.current,
          Math.max(0, 100 * 60 - remainingSecondsRef.current)
        );
      } catch (err) {
        console.error('Autosave error:', err);
      }
    }, 15000);

    return () => clearInterval(saveInterval);
  }, [attemptId, isLoading, questions.length]);

  // Handle Option Select
  const handleSelectOption = async (optionKey: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = answers[currentQ.id] || { selectedOption: null, isDoubtful: false };
    const updatedAnswer: UserAnswer = {
      ...existing,
      selectedOption: optionKey
    };

    const newAnswers = {
      ...answers,
      [currentQ.id]: updatedAnswer
    };
    setAnswers(newAnswers);

    // Save to server
    try {
      setIsSaving(true);
      await api.saveAttemptProgress(attemptId, newAnswers, Math.max(0, 100 * 60 - remainingSeconds));
    } catch (err) {
      console.error('Failed to save answer:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  // Toggle Ragu-ragu (Doubtful)
  const handleToggleDoubtful = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = answers[currentQ.id] || { selectedOption: null, isDoubtful: false };
    const updatedAnswer: UserAnswer = {
      ...existing,
      isDoubtful: !existing.isDoubtful
    };

    const newAnswers = {
      ...answers,
      [currentQ.id]: updatedAnswer
    };
    setAnswers(newAnswers);

    try {
      await api.saveAttemptProgress(attemptId, newAnswers, Math.max(0, 100 * 60 - remainingSeconds));
    } catch {}
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await api.submitAttempt(attemptId, {
        answers: answersRef.current,
        durationSeconds: Math.max(0, 100 * 60 - remainingSecondsRef.current)
      });
      onFinishExam(attemptId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyelesaikan ujian.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-700 font-bold text-sm">Menghubungkan ke Server Database Terpusat...</p>
        <p className="text-slate-400 text-xs mt-1">Mengambil butir soal terverifikasi (Zero AI on Exam Take)</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 font-bold mb-4">{errorMsg || 'Paket soal tidak memiliki butir soal.'}</p>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold"
        >
          Kembali
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ?.id];

  // Stats for numbers grid
  let answeredCount = 0;
  let doubtfulCount = 0;
  questions.forEach(q => {
    const a = answers[q.id];
    if (a?.isDoubtful) doubtfulCount++;
    else if (a?.selectedOption) answeredCount++;
  });
  const unansweredCount = questions.length - (answeredCount + doubtfulCount);

  // Time formatter
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isTimeCritical = remainingSeconds < 300; // < 5 mins
  const isTimeWarning = remainingSeconds < 900; // < 15 mins

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col select-none">
      {/* Top CAT BKN Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-2.5 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Package details */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  CAT BKN - {packageTitle}
                </span>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {packageVersion}
                </span>
                {attemptNumber > 1 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200">
                    Retake #{attemptNumber}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Peserta: <strong className="text-slate-200">{currentUser?.name}</strong> • Sumber: Database Resmi Terpusat
              </p>
            </div>
          </div>

          {/* Timer & Submit Button */}
          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
              <span>{isSaving ? 'Menyimpan...' : 'Tersimpan'}</span>
            </div>

            {/* Live Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-extrabold border shadow-sm ${
                isTimeCritical
                  ? 'bg-red-600/20 text-red-400 border-red-500 animate-pulse'
                  : isTimeWarning
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500'
                  : 'bg-slate-800 text-blue-400 border-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            {/* Selesaikan Ujian Button */}
            <button
              onClick={() => {
                setConfirmChecked(false);
                setShowConfirmModal(true);
              }}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-colors"
            >
              Selesaikan Ujian
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Question Presentation Area (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            {/* Question Subtest & Topic Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                  {currentQ.number}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    currentQ.subtest === 'TWK'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : currentQ.subtest === 'TIU'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}
                >
                  {currentQ.subtest}
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {currentQ.topic}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Soal <strong>{currentIndex + 1}</strong> dari <strong>{questions.length}</strong></span>
              </div>
            </div>

            {/* Question Narrative */}
            <div className="text-slate-900 text-sm sm:text-base leading-relaxed font-medium whitespace-pre-line py-2">
              {currentQ.question}
            </div>

            {/* Options List (A to E) */}
            <div className="space-y-3 pt-2">
              {(['A', 'B', 'C', 'D', 'E'] as Array<'A' | 'B' | 'C' | 'D' | 'E'>).map(optKey => {
                const isSelected = currentAnswer?.selectedOption === optKey;
                const optionText = currentQ.options[optKey];

                return (
                  <button
                    key={optKey}
                    type="button"
                    onClick={() => handleSelectOption(optKey)}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3.5 transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/30 text-blue-950 font-medium'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      {optKey}
                    </span>
                    <span className="text-sm leading-relaxed pt-0.5">{optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Control Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            {/* Previous Question */}
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Ragu-ragu Checkbox */}
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 cursor-pointer hover:bg-amber-100 transition-colors">
              <input
                type="checkbox"
                checked={Boolean(currentAnswer?.isDoubtful)}
                onChange={handleToggleDoubtful}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="text-xs font-bold">Ragu-ragu</span>
            </label>

            {/* Next Question */}
            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 disabled:opacity-40 transition-colors"
            >
              <span>Simpan & Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Question Navigation Matrix Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Candidate Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
              alt={currentUser?.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {currentUser?.id.toUpperCase()}</p>
              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 mt-1">
                Sesi Ujian Aktif
              </span>
            </div>
          </div>

          {/* Question Grid Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Navigasi Butir Soal
            </h4>

            {/* Subtest filter buttons */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[10px] font-bold">
              <button
                onClick={() => setActiveSubtestTab('ALL')}
                className={`py-1 rounded-lg transition-colors ${
                  activeSubtestTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setActiveSubtestTab('TWK')}
                className={`py-1 rounded-lg transition-colors ${
                  activeSubtestTab === 'TWK' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                TWK
              </button>
              <button
                onClick={() => setActiveSubtestTab('TIU')}
                className={`py-1 rounded-lg transition-colors ${
                  activeSubtestTab === 'TIU' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                TIU
              </button>
              <button
                onClick={() => setActiveSubtestTab('TKP')}
                className={`py-1 rounded-lg transition-colors ${
                  activeSubtestTab === 'TKP' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                TKP
              </button>
            </div>

            {/* Number Matrix Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                if (activeSubtestTab !== 'ALL' && q.subtest !== activeSubtestTab) {
                  return null;
                }

                const ans = answers[q.id];
                const isCurrent = idx === currentIndex;
                const isAnswered = ans && ans.selectedOption && !ans.isDoubtful;
                const isDoubtful = ans && ans.isDoubtful;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all ${
                      isCurrent ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : ''
                    } ${
                      isDoubtful
                        ? 'bg-amber-400 text-amber-950 font-black'
                        : isAnswered
                        ? 'bg-emerald-600 text-white font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {q.number}
                  </button>
                );
              })}
            </div>

            {/* Legend & Summary Counters */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block"></span>
                  <span>Sudah Dijawab</span>
                </div>
                <span className="font-bold text-slate-900">{answeredCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block"></span>
                  <span>Ragu-ragu</span>
                </div>
                <span className="font-bold text-slate-900">{doubtfulCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="w-3.5 h-3.5 rounded bg-slate-200 inline-block"></span>
                  <span>Belum Dijawab</span>
                </div>
                <span className="font-bold text-slate-900">{unansweredCount}</span>
              </div>
            </div>

            {/* End Exam Button */}
            <button
              onClick={() => {
                setConfirmChecked(false);
                setShowConfirmModal(true);
              }}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Selesaikan Ujian</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Submission */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5">
              <h3 className="text-lg font-bold">Konfirmasi Penyelesaian Ujian</h3>
              <p className="text-xs text-red-100 mt-0.5">Pastikan seluruh jawaban Anda telah diperiksa.</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Dijawab</span>
                  <div className="text-xl font-black text-emerald-800">{answeredCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Ragu-ragu</span>
                  <div className="text-xl font-black text-amber-800">{doubtfulCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Kosong</span>
                  <div className="text-xl font-black text-slate-800">{unansweredCount}</div>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Masih terdapat <strong>{unansweredCount} soal yang belum dijawab</strong>. Soal kosong bernilai 0 poin.
                  </span>
                </div>
              )}

              {/* Requirement 9 Security Guarantee notice */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 leading-relaxed">
                <strong>Anti-Cheat Active:</strong> Kunci jawaban dan pembahasan resmi dari database akan dibuka tepat setelah Anda menekan tombol konfirmasi ini.
              </div>

              {/* Checkbox agreement */}
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={e => setConfirmChecked(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded mt-0.5"
                />
                <span className="font-medium">
                  Saya telah selesai mengerjakan dan menyatakan siap mengakhiri sesi ujian ini.
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Lanjut Mengerjakan
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || !confirmChecked}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 disabled:opacity-40 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menilai di Server...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Ya, Kumpulkan Jawaban</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
