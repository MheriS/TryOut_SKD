import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserAttempt, PackageListItem } from '../../types';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Award,
  Filter,
  RefreshCw,
  Eye
} from 'lucide-react';

interface ParticipantMonitoringProps {
  onViewReview: (attemptId: string) => void;
}

export const ParticipantMonitoring: React.FC<ParticipantMonitoringProps> = ({ onViewReview }) => {
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchUser, setSearchUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pkgs, analytics] = await Promise.all([
        api.getAdminPackages(),
        api.getAnalyticsDashboard()
      ]);
      setPackages(pkgs);
      setAttempts(analytics.recentAttempts || []);
    } catch (err: any) {
      console.error('Failed to load participant attempts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAttempts = attempts.filter(att => {
    if (selectedPackageId !== 'ALL' && att.packageId !== selectedPackageId) return false;
    if (selectedStatusFilter === 'PASSED' && !att.scores?.isPassedAll) return false;
    if (selectedStatusFilter === 'FAILED' && att.scores?.isPassedAll) return false;
    if (searchUser.trim()) {
      const q = searchUser.toLowerCase();
      return (
        att.userDisplayName.toLowerCase().includes(q) ||
        att.packageTitle.toLowerCase().includes(q) ||
        att.packageCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Monitoring Pengerjaan Peserta Tryout
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data Riwayat Skor, Waktu Pengerjaan, dan Isolasi Sesi Seluruh Peserta
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Package Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Paket:</span>
            <select
              value={selectedPackageId}
              onChange={e => setSelectedPackageId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
            >
              <option value="ALL">Semua Paket Tryout</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Status Kelulusan:</span>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800"
            >
              <option value="ALL">Semua Status</option>
              <option value="PASSED">Lulus (Memenuhi PG)</option>
              <option value="FAILED">Belum Lulus</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
            placeholder="Cari nama peserta..."
            className="w-full px-3 py-1.5 pl-8 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Memuat data monitoring...</span>
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Belum ada peserta yang menyelesaikan tryout.</p>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan switcher akun di kanan atas untuk masuk sebagai peserta dan mengerjakan tryout.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Peserta</th>
                  <th className="py-3 px-4">Paket & Versi</th>
                  <th className="py-3 px-4">Percobaan #</th>
                  <th className="py-3 px-4 text-center">TWK (Min 65)</th>
                  <th className="py-3 px-4 text-center">TIU (Min 80)</th>
                  <th className="py-3 px-4 text-center">TKP (Min 166)</th>
                  <th className="py-3 px-4 text-center">Total Skor</th>
                  <th className="py-3 px-4 text-center">Status Kelulusan</th>
                  <th className="py-3 px-4 text-right">Rincian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.map(att => {
                  const scores = att.scores;
                  const isPassed = scores?.isPassedAll;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                            {att.userDisplayName.charAt(0)}
                          </div>
                          <span>{att.userDisplayName}</span>
                        </div>
                      </td>

                      {/* Package & Version */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{att.packageTitle}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500">{att.packageCode}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                            {att.packageVersion}
                          </span>
                        </div>
                      </td>

                      {/* Attempt Number */}
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
                        <span
                          className={`font-bold ${
                            scores?.twkPassed ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {scores?.twkScore ?? '-'}
                        </span>
                      </td>

                      {/* TIU */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            scores?.tiuPassed ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {scores?.tiuScore ?? '-'}
                        </span>
                      </td>

                      {/* TKP */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            scores?.tkpPassed ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
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
                            SEDANG MENGERJAKAN
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {att.status === 'completed' && (
                          <button
                            onClick={() => onViewReview(att.id)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Hasil</span>
                          </button>
                        )}
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
