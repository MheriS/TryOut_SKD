import React, { useState } from 'react';
import { api } from '../../services/api';
import { TryoutPackage } from '../../types';
import {
  GitBranch,
  X,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface NewVersionModalProps {
  isOpen: boolean;
  packageItem: TryoutPackage | null;
  onClose: () => void;
  onSuccess: (updatedPkg: TryoutPackage) => void;
}

export const NewVersionModal: React.FC<NewVersionModalProps> = ({
  isOpen,
  packageItem,
  onClose,
  onSuccess
}) => {
  const [changelog, setChangelog] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !packageItem) return null;

  const currentVerNumber = packageItem.versions.length;
  const nextVerString = `v${currentVerNumber + 1}.0`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMessage('');

      const updated = await api.createNewVersion(
        packageItem.id,
        changelog.trim() || `Revisi versi baru (${nextVerString}) dari ${packageItem.currentVersion}`
      );

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat versi baru.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Buat Versi Baru Soal</h2>
              <p className="text-sm text-amber-100">Mekanisme Versioning & Immutability</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Explanation Alert */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Ketentuan Proteksi Soal (Aturan #8)</span>
            </div>
            <p className="leading-relaxed">
              Paket ini telah memiliki pengerjaan oleh peserta pada versi <strong>{packageItem.currentVersion}</strong>. Untuk menjaga agar riwayat pengerjaan, skor, dan pembahasan peserta terdahulu tidak rusak atau berubah, sistem mewajibkan pembuatan versi baru.
            </p>
          </div>

          {/* Version Transition Display */}
          <div className="flex items-center justify-center gap-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Versi Saat Ini</span>
              <div className="text-base font-extrabold text-slate-700">{packageItem.currentVersion} (Terkunci)</div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-amber-600">Versi Baru (Draf)</span>
              <div className="text-base font-extrabold text-amber-700">{nextVerString}</div>
            </div>
          </div>

          {/* Changelog field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Catatan Perubahan (Changelog) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={changelog}
              onChange={e => setChangelog(e.target.value)}
              placeholder="Contoh: Pembaruan kunci jawaban soal TWK No. 4 dan penyesuaian narasi TKP..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Seluruh butir soal dari versi lama akan disalin ke draf versi baru untuk Anda edit kembali.</span>
          </div>

          {/* Footer */}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md shadow-amber-600/20 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat Versi...</span>
                </>
              ) : (
                <>
                  <GitBranch className="w-4 h-4" />
                  <span>Buat Versi {nextVerString}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
