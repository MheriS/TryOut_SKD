import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PublicPackageListItem } from '../../types';
import {
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Play,
  Award,
  Layers,
  ShieldCheck,
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';

interface CatalogViewProps {
  onStartExam: (packageId: string) => void;
  onViewLatestResult: (packageId: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onStartExam, onViewLatestResult }) => {
  const { currentUser } = useAuth();
  const [packages, setPackages] = useState<PublicPackageListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingPackageId, setStartingPackageId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadPackages = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const data = await api.getPublicPackages();
      setPackages(data);
    } catch (err: any) {
      console.error('Failed to load packages:', err);
      setErrorMsg(err.message || 'Gagal memuat katalog tryout.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [currentUser?.id]);

  const handleStart = async (pkgId: string) => {
    setStartingPackageId(pkgId);
    try {
      await onStartExam(pkgId);
    } finally {
      setStartingPackageId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm border border-white/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Simulasi Ujian CAT Resmi BKN Terpusat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {currentUser?.name}!
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            Paket tryout di bawah ini telah divalidasi dan disimpan secara permanen di database. Seluruh butir soal, opsi jawaban, dan kunci jawaban bersifat identik untuk semua peserta demi akurasi evaluasi kompetensi.
          </p>
        </div>

        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Passing Grade Standard Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">
              Nilai Ambang Batas (Passing Grade) Resmi SKD CPNS:
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="px-3 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
              TWK: Min 65
            </span>
            <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              TIU: Min 80
            </span>
            <span className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
              TKP: Min 166
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-900 text-white">
              Total Maks: 550
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Tryout Packages Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Daftar Paket Tryout Tersedia</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Total {packages.length} paket siap dikerjakan
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Memuat paket tryout...</span>
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-700">Belum Ada Paket yang Dipublikasikan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Administrator belum memublikasikan paket tryout. Silakan beralih ke akun Administrator untuk membuat dan memvalidasi paket baru.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {packages.map(pkg => {
              const hasAttempted = pkg.attemptCount > 0;
              const isStarting = startingPackageId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border">
                        {pkg.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {pkg.currentVersion}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                          Resmi
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {pkg.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    {/* Specs Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span><strong>{pkg.totalQuestions}</strong> Soal</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span><strong>{pkg.durationMinutes}</strong> Menit</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>TWK, TIU, TKP</span>
                      </div>
                    </div>

                    {/* User's Previous Attempt Status */}
                    {hasAttempted ? (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Riwayat Pengerjaan Anda:</span>
                          <span className="font-bold text-slate-700">Dikerjakan {pkg.attemptCount}x</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Skor Terakhir:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">{pkg.latestScore}</span>
                            {pkg.latestPassed ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>LULUS</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-600" />
                                <span>BELUM LULUS</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800 flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Anda belum pernah mengerjakan paket ini.</span>
                      </div>
                    )}
                  </div>

                  {/* Actions (Mulai / Kerjakan Ulang) */}
                  <div className="pt-2 flex items-center gap-2">
                    {hasAttempted ? (
                      <>
                        <button
                          onClick={() => handleStart(pkg.id)}
                          disabled={isStarting}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isStarting ? 'Memulai...' : 'Kerjakan Ulang'}</span>
                        </button>

                        <button
                          onClick={() => onViewLatestResult(pkg.id)}
                          className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Lihat pembahasan & hasil pengerjaan terakhir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Hasil Terakhir</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStart(pkg.id)}
                        disabled={isStarting}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>{isStarting ? 'Mempersiapkan Soal...' : 'Mulai Kerjakan Tryout'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
