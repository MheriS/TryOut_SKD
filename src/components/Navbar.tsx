import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Sparkles,
  Users,
  BookOpen,
  History,
  Layers,
  Settings,
  UserCheck,
  ChevronDown,
  BarChart3,
  Cpu
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenAiSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenAiSettings }) => {
  const { currentUser, users, isAdmin, switchUser } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(isAdmin ? 'admin-packages' : 'catalog')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  CAT SKD CPNS
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Terpusat
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">BKN Question Engine & Versioning</p>
            </div>
          </div>

          {/* Centralized Rules Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300">
              <strong className="text-emerald-400 font-semibold">AI Terpusat:</strong> Admin Only • Database Standar • Zero AI on Test Take
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={() => onNavigate('admin-packages')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'admin-packages'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Paket Tryout</span>
                </button>

                <button
                  onClick={() => onNavigate('admin-monitoring')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'admin-monitoring'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Monitoring</span>
                </button>

                <button
                  onClick={onOpenAiSettings}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                  title="Konfigurasi Google Gemini API"
                >
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">AI Settings</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('catalog')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'catalog'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Daftar Tryout</span>
                </button>

                <button
                  onClick={() => onNavigate('history')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'history'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Riwayat Skor</span>
                </button>
              </>
            )}

            {/* User Switcher Dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all text-left"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                  alt={currentUser?.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/50"
                />
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight flex items-center gap-1.5">
                    {currentUser?.name}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {currentUser?.role}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Pilih Akun Simulasi:</p>
                      <p className="text-xs text-slate-500 mt-0.5">Uji isolasi data antar pengguna & retake</p>
                    </div>

                    <div className="p-1.5 space-y-1">
                      {users.map(u => {
                        const isSelected = u.id === currentUser?.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setUserDropdownOpen(false);
                              if (u.role === 'admin') {
                                onNavigate('admin-packages');
                              } else {
                                onNavigate('catalog');
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                              isSelected
                                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium text-xs text-white">{u.name}</p>
                                <p className="text-[11px] text-slate-400">{u.email}</p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {u.role}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-1 pt-1 border-t border-slate-800 px-3 py-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Data pengerjaan tersimpan terpisah per akun.</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
