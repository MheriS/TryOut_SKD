import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PackageListItem, DashboardStats, TryoutPackage } from '../../types';
import {
  Layers,
  Plus,
  Search,
  Lock,
  Unlock,
  Sparkles,
  FileCheck,
  GitBranch,
  Archive,
  RefreshCw,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  ExternalLink,
  Edit3
} from 'lucide-react';

interface AdminDashboardProps {
  onEditPackage: (packageId: string) => void;
  onOpenCreateModal: () => void;
  onOpenValidationModal: (pkg: TryoutPackage) => void;
  onOpenNewVersionModal: (pkg: TryoutPackage) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onEditPackage,
  onOpenCreateModal,
  onOpenValidationModal,
  onOpenNewVersionModal
}) => {
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pkgs, analytics] = await Promise.all([
        api.getAdminPackages(),
        api.getAnalyticsDashboard()
      ]);
      setPackages(pkgs);
      setStats(analytics.stats);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setActionError(err.message || 'Gagal memuat data paket.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleArchive = async (pkgId: string) => {
    try {
      setActionError('');
      await api.archivePackage(pkgId);
      setActionSuccess('Paket berhasil diarsipkan.');
      setTimeout(() => setActionSuccess(''), 3000);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Gagal mengarsipkan paket.');
    }
  };

  const handleRestore = async (pkgId: string) => {
    try {
      setActionError('');
      await api.restorePackage(pkgId);
      setActionSuccess('Paket berhasil dipulihkan kembali ke status publikasi.');
      setTimeout(() => setActionSuccess(''), 3000);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Gagal memulihkan paket.');
    }
  };

  const handleDelete = async (pkgId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus paket tryout ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    try {
      setActionError('');
      await api.deletePackage(pkgId);
      setActionSuccess('Paket berhasil dihapus.');
      setTimeout(() => setActionSuccess(''), 3000);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Gagal menghapus paket.');
    }
  };

  const handleFetchFullPackageAndTrigger = async (pkgId: string, action: 'validate' | 'new-version') => {
    try {
      const fullPkg = await api.getAdminPackageById(pkgId);
      if (action === 'validate') {
        onOpenValidationModal(fullPkg);
      } else {
        onOpenNewVersionModal(fullPkg);
      }
    } catch (err: any) {
      setActionError(err.message || 'Gagal memuat rincian paket.');
    }
  };

  const filteredPackages = packages.filter(pkg => {
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'DRAFT' && pkg.status !== 'draft' && pkg.status !== 'in_review') return false;
      if (filterStatus === 'PUBLISHED' && pkg.status !== 'published') return false;
      if (filterStatus === 'ARCHIVED' && pkg.status !== 'archived') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return pkg.title.toLowerCase().includes(q) || pkg.code.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner / Hero */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Manajemen Paket Tryout SKD
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Generasi Soal Terpusat, Validasi Kurikulum BKN & Proteksi Versi Immutability
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Buat Paket Baru (AI Generator)</span>
        </button>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Paket</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalPackages}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.publishedPackages} aktif dipublikasikan</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Terpublikasi</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{stats.publishedPackages}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Tersedia di katalog peserta</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Draf & Review</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.draftPackages + stats.inReviewPackages}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Menunggu persetujuan</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Pengerjaan</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{stats.totalAttempts}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Dari {stats.totalParticipants} peserta</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Kelulusan Rata-rata</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{stats.passingRate}%</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Memenuhi PG TWK, TIU, TKP</span>
          </div>
        </div>
      )}

      {/* Central Rules Principle Callout Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 font-bold text-xs uppercase border border-blue-400/30">
              Prinsip Arsitektur Terpusat
            </span>
            <span className="text-xs text-slate-300">Keputusan BKN & Standar Ujian CAT</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed max-w-4xl">
            1. AI hanya dipanggil satu kali saat admin membuat draf paket. <br className="hidden sm:inline" />
            2. Seluruh peserta mendapatkan butir soal, opsi, dan kunci yang identik dari database. <br className="hidden sm:inline" />
            3. Saat ujian berlangsung, sistem <strong>TIDAK PERNAH memanggil AI</strong>. Kunci jawaban & pembahasan diamankan di server hingga ujian selesai.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({packages.length})
          </button>
          <button
            onClick={() => setFilterStatus('PUBLISHED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'PUBLISHED'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Terpublikasi ({packages.filter(p => p.status === 'published').length})
          </button>
          <button
            onClick={() => setFilterStatus('DRAFT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'DRAFT'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Draf & Review ({packages.filter(p => p.status === 'draft' || p.status === 'in_review').length})
          </button>
          <button
            onClick={() => setFilterStatus('ARCHIVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === 'ARCHIVED'
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Diarsipkan ({packages.filter(p => p.status === 'archived').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau kode paket..."
            className="w-full px-3 py-1.5 pl-8 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Packages Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Memuat data paket...</span>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Tidak ada paket tryout yang sesuai.</p>
            <p className="text-xs text-slate-400 mt-1">Buat paket baru menggunakan AI Generator untuk memulai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Kode & Judul Paket</th>
                  <th className="py-3 px-4">Versi & Status</th>
                  <th className="py-3 px-4">Total Soal & Durasi</th>
                  <th className="py-3 px-4">Pengerjaan Peserta</th>
                  <th className="py-3 px-4">Status Kunci (Lock)</th>
                  <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Title & Code */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border">
                          {pkg.code}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{pkg.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{pkg.description}</p>
                    </td>

                    {/* Version & Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {pkg.currentVersion}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full uppercase text-[10px] ${
                            pkg.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pkg.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : pkg.status === 'in_review'
                              ? 'bg-amber-100 text-amber-800'
                              : pkg.status === 'archived'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {pkg.status}
                        </span>
                      </div>
                      {pkg.versionCount > 1 && (
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Total {pkg.versionCount} riwayat versi
                        </span>
                      )}
                    </td>

                    {/* Questions & Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{pkg.totalQuestions} Butir Soal</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{pkg.durationMinutes} Menit</span>
                      </div>
                    </td>

                    {/* Attempts */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-slate-800">{pkg.versionAttempts} sesi</span>
                      </div>
                      {pkg.totalAttempts !== pkg.versionAttempts && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {pkg.totalAttempts} lintas seluruh versi
                        </span>
                      )}
                    </td>

                    {/* Immutability Lock Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {pkg.isLocked ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold" title="Versi ini tidak boleh diedit langsung karena telah dikerjakan peserta. Gunakan Buat Versi Baru.">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Terkunci (Immutable)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>Dapat Diedit</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Questions Button */}
                        <button
                          onClick={() => onEditPackage(pkg.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:text-blue-700 hover:bg-slate-100 font-semibold transition-colors flex items-center gap-1"
                          title="Buka Editor Soal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Validation & Publish Button */}
                        <button
                          onClick={() => handleFetchFullPackageAndTrigger(pkg.id, 'validate')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-semibold transition-colors flex items-center gap-1"
                          title="Validasi & Publikasi"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Validasi</span>
                        </button>

                        {/* If locked, quick "Buat Versi Baru" button */}
                        {pkg.isLocked && (
                          <button
                            onClick={() => handleFetchFullPackageAndTrigger(pkg.id, 'new-version')}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-semibold transition-colors flex items-center gap-1"
                            title="Buat Versi Baru"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                            <span>Versi Baru</span>
                          </button>
                        )}

                        {/* Archive / Restore Button */}
                        {pkg.status === 'archived' ? (
                          <button
                            onClick={() => handleRestore(pkg.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                            title="Pulihkan Paket"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(pkg.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100"
                            title="Arsipkan Paket"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button (only if 0 attempts) */}
                        {pkg.totalAttempts === 0 && (
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100"
                            title="Hapus Paket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
