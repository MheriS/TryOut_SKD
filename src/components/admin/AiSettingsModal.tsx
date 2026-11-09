import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Cpu,
  X,
  Key,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSettings();
      setHasKey(res.hasGeminiApiKey);
      setMaskedKey(res.maskedKey);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      setSaveSuccess(false);
      setErrorMsg('');
      setApiKey('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setErrorMsg('Masukkan Gemini API Key yang valid.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');
      await api.updateSettings(apiKey.trim());
      setSaveSuccess(true);
      setApiKey('');
      await loadSettings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan API Key.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Pengaturan Gemini AI</h2>
              <p className="text-xs text-slate-300">Centralized AI Generator Engine</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Gemini API Key berhasil disimpan dan aktif!</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Status Integrasi:</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  hasKey
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasKey ? '🟢 Gemini AI Aktif' : '🟡 Standar Engine (Fallback)'}
              </span>
            </div>
            {hasKey ? (
              <p className="text-xs text-slate-500 font-mono">
                Key Aktif: <strong className="text-slate-800">{maskedKey}</strong>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Sistem saat ini menggunakan Bank Soal Standar BKN terverifikasi. Masukkan API Key di bawah untuk mengaktifkan AI generative langsung.
              </p>
            )}
          </div>

          {/* Input New Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <span>Dapatkan Gemini API Key Gratis di Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Architecture principle note */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Keamanan Kuota:</strong> Sesuai prinsip nomor 5, kuota API hanya digunakan oleh Admin saat membuat paket soal. Peserta ujian tidak akan mengonsumsi API key Anda.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={isSaving || !apiKey.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan API Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
