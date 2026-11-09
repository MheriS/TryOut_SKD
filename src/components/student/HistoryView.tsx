import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserAttempt } from '../../types';
import {
  History,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  TrendingUp,
  Award,
  Clock,
  Layers,
  RefreshCw,
  BookOpen
} from 'lucide-react';

interface HistoryViewProps {
  onViewReview: (attemptId: string) => void;
  onRetake: (packageId: string) => void;
  onBackToCatalog: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onViewReview,
  onRetake,
  onBackToCatalog
}) => {
  const { currentUser } = useAuth();
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const data = await api.getUserAttempts(currentUser.id);
      setAttempts(data);
    } catch (err: any) {
      console.error('Failed to load user history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser?.id]);

  const completedAttempts = attempts.filter(a => a.status === 'completed');
  const bestScore = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map(a => a.scores?.totalScore || 0))
    : 0;
  const passedCount = completedAttempts.filter(a => a.scores?.isPassedAll).length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Tryout Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data Pengerjaan, Tren Nilai, dan Evaluasi Latihan SKD untuk <strong>{currentUser?.name}</strong>
          </p>
        </div>

        <button
          onClick={onBackToCatalog}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
        >
          Lihat Daftar Tryout
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Percobaan</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{completedAttempts.length}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Sesi ujian diselesaikan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Skor Tertinggi</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{bestScore}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Dari maksimal 550</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Kelulusan</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{passedCount}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Memenuhi ambang batas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Status Akun</span>
          <div className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Tersimpan Terpisah</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Isolasi data aktif (Req #6)</span>
        </div>
      </div>

      {/* Attempts List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Memuat riwayat pengerjaan...</span>
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Belum ada riwayat pengerjaan.</p>
            <p className="text-xs text-slate-400 mt-1">
              Pilih paket tryout di katalog dan mulai pengerjaan pertama Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Paket & Versi</th>
                  <th className="py-3 px-4">Percobaan #</th>
                  <th className="py-3 px-4 text-center">TWK (Min 65)</th>
                  <th className="py-3 px-4 text-center">TIU (Min 80)</th>
                  <th className="py-3 px-4 text-center">TKP (Min 166)</th>
                  <th className="py-3 px-4 text-center">Total Skor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map(att => {
                  const scores = att.scores;
                  const isPassed = scores?.isPassedAll;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Package */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{att.packageTitle}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500">{att.packageCode}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                            {att.packageVersion}
                          </span>
                        </div>
                      </td>

                      {/* Attempt */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          Percobaan #{att.attemptNumber}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(att.startedAt).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      {/* TWK */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`font-bold ${scores?.twkPassed ? 'text-emerald-700' : 'text-red-600'}`}>
                          {scores?.twkScore ?? '-'}
                        </span>
                      </td>

                      {/* TIU */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`font-bold ${scores?.tiuPassed ? 'text-emerald-700' : 'text-red-600'}`}>
                          {scores?.tiuScore ?? '-'}
                        </span>
                      </td>

                      {/* TKP */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`font-bold ${scores?.tkpPassed ? 'text-emerald-700' : 'text-red-600'}`}>
                          {scores?.tkpScore ?? '-'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-black text-slate-900 text-sm">
                          {scores?.totalScore ?? '-'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {att.status === 'completed' ? (
                          isPassed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>LULUS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>BELUM LULUS</span>
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            SEDANG BERLANGSUNG
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {att.status === 'completed' && (
                            <button
                              onClick={() => onViewReview(att.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Pembahasan</span>
                            </button>
                          )}

                          <button
                            onClick={() => onRetake(att.packageId)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition-colors inline-flex items-center gap-1"
                            title="Kerjakan ulang paket tryout ini"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Ulang</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
