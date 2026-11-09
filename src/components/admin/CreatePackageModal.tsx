import React, { useState } from 'react';
import { api } from '../../services/api';
import { TryoutPackage } from '../../types';
import {
  Sparkles,
  X,
  Cpu,
  Layers,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (pkg: TryoutPackage) => void;
}

export const CreatePackageModal: React.FC<CreatePackageModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(100);
  const [generateWithAi, setGenerateWithAi] = useState(true);

  // Subtest counts
  const [twkCount, setTwkCount] = useState(5);
  const [tiuCount, setTiuCount] = useState(5);
  const [tkpCount, setTkpCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'Campuran (Standar BKN)' | 'HOTS' | 'Sedang' | 'Mudah'>('Campuran (Standar BKN)');
  const [specificTopics, setSpecificTopics] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const totalQuestions = twkCount + tiuCount + tkpCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Judul paket wajib diisi.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      if (generateWithAi) {
        setLoadingStep('Memanggil AI Engine untuk menyusun butir soal SKD...');
      } else {
        setLoadingStep('Membuat draf paket tryout di database...');
      }

      const result = await api.createPackage({
        title,
        code: code.trim() || undefined,
        description,
        durationMinutes: Number(durationMinutes),
        generateWithAi,
        aiConfig: generateWithAi ? {
          twk: Number(twkCount),
          tiu: Number(tiuCount),
          tkp: Number(tkpCount),
          difficulty,
          specificTopics: specificTopics.trim() || undefined
        } : undefined
      });

      onCreated(result.package);
      onClose();
    } catch (err: any) {
      console.error('Failed to create package:', err);
      setErrorMessage(err.message || 'Gagal membuat paket tryout.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 relative">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Buat Paket Tryout SKD Baru</h2>
              <p className="text-sm text-blue-100">
                AI Question Generation Terpusat dengan Database Storage
              </p>
            </div>
          </div>
        </div>

        {/* Centralized AI Rule Callout */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-6 py-3 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 leading-relaxed">
            <strong>Prinsip Terpusat:</strong> AI hanya dipanggil <em>satu kali</em> di langkah pembuatan ini. Seluruh butir soal yang dihasilkan akan disimpan permanen ke database setelah divalidasi admin. Seluruh peserta yang mengerjakan akan menerima soal yang sama persis dari database tanpa memanggil AI.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title & Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Judul Paket Tryout <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Tryout 3 - SKD CPNS 2026 HOTS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kode Paket (Otomatis)
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="TO-SKD-003"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono uppercase"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Simulasi terpadu dengan soal penalaran kritis dan studi kasus..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Durasi Pengerjaan (Menit)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={10}
                max={180}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-32 px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Standar SKD BKN: 100 menit
              </span>
            </div>
          </div>

          {/* AI Generation Section */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-800">Generasi Soal Otomatis dengan AI</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateWithAi}
                  onChange={e => setGenerateWithAi(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {generateWithAi && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in">
                {/* Question Counts per Subtest */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700">Komposisi Butir Soal</label>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Total: {totalQuestions} Soal
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-red-600 mb-1">TWK (Wawasan)</div>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={twkCount}
                        onChange={e => setTwkCount(Number(e.target.value))}
                        className="w-full px-2 py-1 border rounded text-sm font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Std: 30 soal (5 pt/soal)</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-blue-600 mb-1">TIU (Inteligensia)</div>
                      <input
                        type="number"
                        min={1}
                        max={35}
                        value={tiuCount}
                        onChange={e => setTiuCount(Number(e.target.value))}
                        className="w-full px-2 py-1 border rounded text-sm font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Std: 35 soal (5 pt/soal)</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-xs font-bold text-purple-600 mb-1">TKP (Karakteristik)</div>
                      <input
                        type="number"
                        min={1}
                        max={45}
                        value={tkpCount}
                        onChange={e => setTkpCount(Number(e.target.value))}
                        className="w-full px-2 py-1 border rounded text-sm font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Std: 45 soal (Skala 1-5)</span>
                    </div>
                  </div>
                </div>

                {/* Difficulty & Topics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tingkat Kesulitan
                    </label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    >
                      <option value="Campuran (Standar BKN)">Campuran (Standar BKN)</option>
                      <option value="HOTS">Dominan HOTS (Penalaran Tinggi)</option>
                      <option value="Sedang">Tingkat Sedang</option>
                      <option value="Mudah">Tingkat Mudah / Pengenalan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fokus Topik Spesifik (Opsional)
                    </label>
                    <input
                      type="text"
                      value={specificTopics}
                      onChange={e => setSpecificTopics(e.target.value)}
                      placeholder="Misal: UUD 1945, Silogisme, Pelayanan Publik"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900">{loadingStep}</p>
                <p className="text-xs text-blue-700 mt-0.5">Mohon tunggu, proses generasi menyusun butir soal dan kunci...</p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Buat & Simpan ke Draf</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
