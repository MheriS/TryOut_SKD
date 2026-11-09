import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TryoutPackage, Question, Subtest, Difficulty, OptionMap, TkpScoreMap } from '../../types';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  Sparkles,
  FileCheck,
  Send,
  HelpCircle,
  Eye,
  Info
} from 'lucide-react';

interface PackageEditorProps {
  packageId: string;
  onBack: () => void;
  onOpenValidation: (pkg: TryoutPackage) => void;
  onOpenNewVersion: (pkg: TryoutPackage) => void;
}

export const PackageEditor: React.FC<PackageEditorProps> = ({
  packageId,
  onBack,
  onOpenValidation,
  onOpenNewVersion
}) => {
  const [pkg, setPkg] = useState<(TryoutPackage & { versionAttempts: number; isLocked: boolean }) | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeSubtestFilter, setActiveSubtestFilter] = useState<'ALL' | Subtest>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Editable metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(100);

  const loadPackage = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminPackageById(packageId);
      setPkg(data);
      setTitle(data.title);
      setDescription(data.description);
      setDurationMinutes(data.durationMinutes);

      const activeVer = data.versions.find(v => v.version === data.currentVersion) || data.versions[data.versions.length - 1];
      setQuestions(activeVer ? [...activeVer.questions] : []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat detail paket.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackage();
  }, [packageId]);

  if (isLoading || !pkg) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Memuat editor paket soal...</p>
      </div>
    );
  }

  const activeVer = pkg.versions.find(v => v.version === pkg.currentVersion) || pkg.versions[0];
  const isLocked = pkg.isLocked || (pkg.versionAttempts && pkg.versionAttempts > 0);

  // Question editing helpers
  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    if (isLocked) return;
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optKey: keyof OptionMap, value: string) => {
    if (isLocked) return;
    const updated = [...questions];
    updated[qIndex] = {
      ...updated[qIndex],
      options: {
        ...updated[qIndex].options,
        [optKey]: value
      }
    };
    setQuestions(updated);
  };

  const handleTkpScoreChange = (qIndex: number, optKey: keyof TkpScoreMap, score: number) => {
    if (isLocked) return;
    const updated = [...questions];
    const currentTkp = updated[qIndex].tkpScores || { A: 5, B: 4, C: 3, D: 2, E: 1 };
    updated[qIndex] = {
      ...updated[qIndex],
      tkpScores: {
        ...currentTkp,
        [optKey]: Number(score)
      }
    };
    setQuestions(updated);
  };

  const handleAddQuestion = (subtest: Subtest) => {
    if (isLocked) return;
    const newQ: Question = {
      id: `q_${subtest.toLowerCase()}_${Date.now()}`,
      number: questions.length + 1,
      subtest,
      topic: subtest === 'TWK' ? 'Wawasan Kebangsaan' : subtest === 'TIU' ? 'Penalaran Logika' : 'Pelayanan Publik',
      difficulty: 'Sedang',
      question: '',
      options: {
        A: '',
        B: '',
        C: '',
        D: '',
        E: ''
      },
      correctAnswer: subtest !== 'TKP' ? 'A' : undefined,
      tkpScores: subtest === 'TKP' ? { A: 5, B: 4, C: 3, D: 2, E: 1 } : undefined,
      explanation: ''
    };
    setQuestions([...questions, newQ]);
  };

  const handleDeleteQuestion = (index: number) => {
    if (isLocked) return;
    const filtered = questions.filter((_, i) => i !== index).map((q, idx) => ({
      ...q,
      number: idx + 1
    }));
    setQuestions(filtered);
  };

  const handleSave = async () => {
    if (isLocked) return;
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSaveSuccessMessage('');

      await api.updatePackage(pkg.id, {
        title,
        description,
        durationMinutes,
        questions,
        targetVersion: pkg.currentVersion
      });

      setSaveSuccessMessage('Seluruh butir soal dan kunci berhasil disimpan secara permanen ke database!');
      setTimeout(() => setSaveSuccessMessage(''), 4000);
      await loadPackage();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (activeSubtestFilter === 'ALL') return true;
    return q.subtest === activeSubtestFilter;
  });

  const twkTotal = questions.filter(q => q.subtest === 'TWK').length;
  const tiuTotal = questions.filter(q => q.subtest === 'TIU').length;
  const tkpTotal = questions.filter(q => q.subtest === 'TKP').length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border">
                {pkg.code}
              </span>
              <span className="font-bold text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                {pkg.currentVersion}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  activeVer?.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeVer?.status === 'approved'
                    ? 'bg-blue-100 text-blue-800'
                    : activeVer?.status === 'in_review'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {activeVer?.status?.toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight">{pkg.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Versioning or Validation Actions */}
          {isLocked ? (
            <button
              onClick={() => onOpenNewVersion(pkg)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>Buat Versi Baru (Terkunci)</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>

              <button
                onClick={() => onOpenValidation(pkg)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <FileCheck className="w-4 h-4" />
                <span>Validasi & Publikasi</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Immutability Notice (Req 8) */}
      {isLocked && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Sistem Immutability Aktif (Paket Terkunci)</h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Versi <strong>{pkg.currentVersion}</strong> telah dikerjakan oleh <strong>{pkg.versionAttempts} peserta</strong>. Sesuai ketentuan nomor 8, butir soal yang sudah digunakan dalam pengerjaan tidak dapat diedit secara langsung demi menjaga validitas nilai dan histori peserta. Klik <strong>"Buat Versi Baru"</strong> untuk merilis versi berikutnya (misal: v2.0) tanpa mengubah versi ini.
            </p>
          </div>
        </div>
      )}

      {/* Package Metadata Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Informasi Umum Paket</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Paket</label>
            <input
              type="text"
              disabled={Boolean(isLocked)}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm disabled:bg-slate-100 disabled:text-slate-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Durasi Pengerjaan (Menit)</label>
            <input
              type="number"
              disabled={Boolean(isLocked)}
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm disabled:bg-slate-100 disabled:text-slate-500 font-medium"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi Paket</label>
            <textarea
              rows={2}
              disabled={Boolean(isLocked)}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Subtests Filter Bar & Question Count Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubtestFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeSubtestFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Soal ({questions.length})
          </button>
          <button
            onClick={() => setActiveSubtestFilter('TWK')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeSubtestFilter === 'TWK'
                ? 'bg-red-600 text-white'
                : 'text-red-700 bg-red-50 hover:bg-red-100'
            }`}
          >
            TWK ({twkTotal})
          </button>
          <button
            onClick={() => setActiveSubtestFilter('TIU')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeSubtestFilter === 'TIU'
                ? 'bg-blue-600 text-white'
                : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            TIU ({tiuTotal})
          </button>
          <button
            onClick={() => setActiveSubtestFilter('TKP')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeSubtestFilter === 'TKP'
                ? 'bg-purple-600 text-white'
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
            }`}
          >
            TKP ({tkpTotal})
          </button>
        </div>

        {!isLocked && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddQuestion('TWK')}
              className="text-xs font-bold text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> +TWK
            </button>
            <button
              onClick={() => handleAddQuestion('TIU')}
              className="text-xs font-bold text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> +TIU
            </button>
            <button
              onClick={() => handleAddQuestion('TKP')}
              className="text-xs font-bold text-purple-700 hover:bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> +TKP
            </button>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {filteredQuestions.map((q, qIndex) => {
          // Find real index in whole array
          const realIndex = questions.findIndex(item => item.id === q.id);

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4"
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center">
                    {q.number}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      q.subtest === 'TWK'
                        ? 'bg-red-100 text-red-800'
                        : q.subtest === 'TIU'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {q.subtest}
                  </span>
                  <input
                    type="text"
                    disabled={Boolean(isLocked)}
                    value={q.topic}
                    onChange={e => handleQuestionChange(realIndex, 'topic', e.target.value)}
                    placeholder="Topik / Kisi-kisi"
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 w-48 disabled:bg-slate-50"
                  />
                  <select
                    disabled={Boolean(isLocked)}
                    value={q.difficulty}
                    onChange={e => handleQuestionChange(realIndex, 'difficulty', e.target.value as Difficulty)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 disabled:bg-slate-50"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="HOTS">HOTS</option>
                  </select>
                </div>

                {!isLocked && (
                  <button
                    onClick={() => handleDeleteQuestion(realIndex)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    title="Hapus butir soal ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Isi Narasi / Pertanyaan</label>
                <textarea
                  rows={3}
                  disabled={Boolean(isLocked)}
                  value={q.question}
                  onChange={e => handleQuestionChange(realIndex, 'question', e.target.value)}
                  placeholder="Tuliskan narasi pertanyaan di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm disabled:bg-slate-50 leading-relaxed font-sans"
                />
              </div>

              {/* Options & Keys */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Pilihan Jawaban (A s.d. E)</label>
                  <span className="text-[11px] text-slate-500">
                    {q.subtest === 'TKP'
                      ? 'TKP: Tentukan bobot poin nilai (1 s.d. 5) pada setiap opsi'
                      : 'TWK & TIU: Pilih radio button pada opsi yang menjadi KUNCI JAWABAN BENAR (+5 Poin)'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(['A', 'B', 'C', 'D', 'E'] as Array<keyof OptionMap>).map(optKey => {
                    const isCorrectAnswer = q.correctAnswer === optKey;
                    const tkpScore = q.tkpScores ? q.tkpScores[optKey as keyof TkpScoreMap] : 1;

                    return (
                      <div
                        key={optKey}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          isCorrectAnswer
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        {/* Selector for TWK/TIU vs TKP */}
                        {q.subtest !== 'TKP' ? (
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              disabled={Boolean(isLocked)}
                              checked={isCorrectAnswer}
                              onChange={() => handleQuestionChange(realIndex, 'correctAnswer', optKey)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span
                              className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                                isCorrectAnswer
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border text-slate-700'
                              }`}
                            >
                              {optKey}
                            </span>
                          </label>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center border border-purple-200">
                              {optKey}
                            </span>
                            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200" title="Bobot nilai 1-5">
                              <span className="text-[10px] text-slate-400 font-bold">Skor:</span>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                disabled={Boolean(isLocked)}
                                value={tkpScore}
                                onChange={e => handleTkpScoreChange(realIndex, optKey as keyof TkpScoreMap, Number(e.target.value))}
                                className="w-8 text-center text-xs font-extrabold text-purple-700 focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* Option Text Input */}
                        <input
                          type="text"
                          disabled={Boolean(isLocked)}
                          value={q.options[optKey]}
                          onChange={e => handleOptionChange(realIndex, optKey, e.target.value)}
                          placeholder={`Teks pilihan ${optKey}...`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white disabled:bg-slate-100"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation (Pembahasan) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pembahasan & Kunci Analisis
                </label>
                <textarea
                  rows={2}
                  disabled={Boolean(isLocked)}
                  value={q.explanation}
                  onChange={e => handleQuestionChange(realIndex, 'explanation', e.target.value)}
                  placeholder="Jelaskan alasan dan kaidah penyelesaian logis untuk butir soal ini..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-amber-50/30 text-slate-800 disabled:bg-slate-50"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save Bar when in Draft */}
      {!isLocked && (
        <div className="sticky bottom-6 z-20 bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">
              Total Soal: <strong className="text-white font-bold">{questions.length}</strong> (TWK: {twkTotal}, TIU: {tiuTotal}, TKP: {tkpTotal})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>

            <button
              onClick={() => onOpenValidation(pkg)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              <span>Validasi & Publikasi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
