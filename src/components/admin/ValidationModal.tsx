import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TryoutPackage, ValidationReport } from '../../types';
import {
  FileCheck,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Send,
  Loader2,
  CheckCheck,
  ShieldAlert,
  Info
} from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  packageItem: TryoutPackage | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  packageItem,
  onClose,
  onSuccess
}) => {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const runValidation = async () => {
    if (!packageItem) return;
    try {
      setIsValidating(true);
      setErrorMessage('');
      const rep = await api.validatePackage(packageItem.id, packageItem.currentVersion);
      setReport(rep);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menjalankan validasi soal.');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (isOpen && packageItem) {
      runValidation();
    }
  }, [isOpen, packageItem]);

  if (!isOpen || !packageItem) return null;

  const activeVer = packageItem.versions.find(v => v.version === packageItem.currentVersion) || packageItem.versions[0];

  const handleApprove = async () => {
    try {
      setIsPublishing(true);
      setErrorMessage('');
      await api.approvePackage(packageItem.id, packageItem.currentVersion, 'Administrator BKN');
      setActionMessage('Paket soal berhasil disetujui (Approved)!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyetujui paket.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setErrorMessage('');
      await api.publishPackage(packageItem.id, packageItem.currentVersion);
      setActionMessage('Paket tryout berhasil dipublikasikan! Peserta kini dapat mengaksesnya.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memublikasikan paket.');
    } finally {
      setIsPublishing(false);
    }
  };

  const errors = report?.issues.filter(i => i.type === 'error') || [];
  const warnings = report?.issues.filter(i => i.type === 'warning') || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Validasi & Publikasi Paket</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                  {packageItem.currentVersion}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{packageItem.title}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {actionMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 font-medium">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isValidating ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm text-slate-600 font-medium">Menjalankan verifikasi butir soal, opsi A-E, dan bobot nilai...</p>
            </div>
          ) : report ? (
            <>
              {/* Validation Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  report.isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {report.isValid ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {report.isValid
                      ? 'Lolos Validasi Standar BKN (Siap Publikasi)'
                      : 'Paket Belum Lolos Validasi'}
                  </h4>
                  <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                    {report.isValid
                      ? 'Seluruh butir soal telah memiliki pertanyaan lengkap, opsi A-E, kunci jawaban untuk TWK/TIU, serta bobot nilai 1-5 untuk TKP.'
                      : 'Terdapat butir soal yang belum memenuhi spesifikasi format. Silakan perbaiki sebelum menyetujui atau memublikasikan.'}
                  </p>
                </div>
              </div>

              {/* Subtests Breakdown */}
              <div className="grid grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Soal</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-0.5">{report.totalQuestions}</div>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <div className="text-[11px] font-semibold text-red-700 uppercase">TWK</div>
                  <div className="text-lg font-extrabold text-red-800 mt-0.5">{report.twkCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-[11px] font-semibold text-blue-700 uppercase">TIU</div>
                  <div className="text-lg font-extrabold text-blue-800 mt-0.5">{report.tiuCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[11px] font-semibold text-purple-700 uppercase">TKP</div>
                  <div className="text-lg font-extrabold text-purple-800 mt-0.5">{report.tkpCount}</div>
                </div>
              </div>

              {/* Issues List (Errors & Warnings) */}
              {report.issues.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Catatan Verifikasi ({report.issues.length})
                  </h5>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-1">
                    {report.issues.map((iss, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                          iss.type === 'error'
                            ? 'bg-red-50/60 border-red-200 text-red-800'
                            : 'bg-amber-50/60 border-amber-200 text-amber-800'
                        }`}
                      >
                        {iss.type === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <span>{iss.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirement Rule Explanation */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Persetujuan & Publikasi:</strong> Ketika dipublikasikan, seluruh butir soal disimpan permanen di database. Seluruh pengguna akan mendapatkan soal dan opsi yang identik. Kunci jawaban dan pembahasan diamankan di backend dan tidak akan dikirim ke frontend sebelum pengguna menyelesaikan ujian.
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={runValidation}
              disabled={isValidating || isPublishing}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              Uji Ulang
            </button>

            {report?.isValid && (
              <>
                {activeVer?.status !== 'approved' && activeVer?.status !== 'published' && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isPublishing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Setujui (Approve)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Publikasikan ke Peserta</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
