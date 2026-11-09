import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PackageEditor } from './components/admin/PackageEditor';
import { CreatePackageModal } from './components/admin/CreatePackageModal';
import { ValidationModal } from './components/admin/ValidationModal';
import { NewVersionModal } from './components/admin/NewVersionModal';
import { AiSettingsModal } from './components/admin/AiSettingsModal';
import { ParticipantMonitoring } from './components/admin/ParticipantMonitoring';
import { CatalogView } from './components/student/CatalogView';
import { CatExamRunner } from './components/student/CatExamRunner';
import { ExamResultView } from './components/student/ExamResultView';
import { HistoryView } from './components/student/HistoryView';
import { TryoutPackage } from './types';
import { api } from './services/api';

function MainApp() {
  const { currentUser, isAdmin } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('catalog');
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isAiSettingsModalOpen, setIsAiSettingsModalOpen] = useState(false);
  const [selectedPackageForModal, setSelectedPackageForModal] = useState<TryoutPackage | null>(null);

  // If user role changed to admin while in student views, adjust tab
  React.useEffect(() => {
    if (isAdmin && (currentTab === 'catalog' || currentTab === 'history')) {
      setCurrentTab('admin-packages');
    } else if (!isAdmin && (currentTab === 'admin-packages' || currentTab === 'admin-monitoring')) {
      setCurrentTab('catalog');
    }
  }, [isAdmin]);

  // Handlers
  const handleOpenEditPackage = (packageId: string) => {
    setActivePackageId(packageId);
    setCurrentTab('admin-edit-package');
  };

  const handleOpenValidation = (pkg: TryoutPackage) => {
    setSelectedPackageForModal(pkg);
    setIsValidationModalOpen(true);
  };

  const handleOpenNewVersion = (pkg: TryoutPackage) => {
    setSelectedPackageForModal(pkg);
    setIsNewVersionModalOpen(true);
  };

  const handleStartExam = async (packageId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.startAttempt(packageId, currentUser.id);
      setActiveAttemptId(res.attemptId);
      setCurrentTab('exam-runner');
    } catch (err: any) {
      alert(err.message || 'Gagal memulai ujian tryout.');
    }
  };

  const handleFinishExam = (attemptId: string) => {
    setActiveAttemptId(attemptId);
    setCurrentTab('exam-result');
  };

  const handleRetakeExam = async (packageId: string) => {
    await handleStartExam(packageId);
  };

  const handleViewReview = (attemptId: string) => {
    setActiveAttemptId(attemptId);
    setCurrentTab('exam-result');
  };

  const handleViewLatestResult = async (packageId: string) => {
    if (!currentUser) return;
    try {
      const attempts = await api.getUserAttempts(currentUser.id);
      const pkgAttempts = attempts.filter(a => a.packageId === packageId && a.status === 'completed');
      if (pkgAttempts.length > 0) {
        setActiveAttemptId(pkgAttempts[0].id);
        setCurrentTab('exam-result');
      } else {
        alert('Belum ada riwayat pengerjaan selesai untuk paket ini.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memuat riwayat.');
    }
  };

  // If in CAT Exam Runner mode, show dedicated distraction-free CAT view
  if (currentTab === 'exam-runner' && activeAttemptId) {
    return (
      <CatExamRunner
        attemptId={activeAttemptId}
        onFinishExam={handleFinishExam}
        onExit={() => setCurrentTab('catalog')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={tab => setCurrentTab(tab)}
        onOpenAiSettings={() => setIsAiSettingsModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {/* Admin Views */}
        {currentTab === 'admin-packages' && (
          <AdminDashboard
            onEditPackage={handleOpenEditPackage}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenValidationModal={handleOpenValidation}
            onOpenNewVersionModal={handleOpenNewVersion}
          />
        )}

        {currentTab === 'admin-edit-package' && activePackageId && (
          <PackageEditor
            packageId={activePackageId}
            onBack={() => setCurrentTab('admin-packages')}
            onOpenValidation={handleOpenValidation}
            onOpenNewVersion={handleOpenNewVersion}
          />
        )}

        {currentTab === 'admin-monitoring' && (
          <ParticipantMonitoring
            onViewReview={handleViewReview}
          />
        )}

        {/* Student Views */}
        {currentTab === 'catalog' && (
          <CatalogView
            onStartExam={handleStartExam}
            onViewLatestResult={handleViewLatestResult}
          />
        )}

        {currentTab === 'exam-result' && activeAttemptId && (
          <ExamResultView
            attemptId={activeAttemptId}
            onRetake={handleRetakeExam}
            onBackToCatalog={() => setCurrentTab('catalog')}
            onViewHistory={() => setCurrentTab('history')}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            onViewReview={handleViewReview}
            onRetake={handleRetakeExam}
            onBackToCatalog={() => setCurrentTab('catalog')}
          />
        )}
      </main>

      {/* Admin Modals */}
      <CreatePackageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={newPkg => {
          setActivePackageId(newPkg.id);
          setCurrentTab('admin-edit-package');
        }}
      />

      <ValidationModal
        isOpen={isValidationModalOpen}
        packageItem={selectedPackageForModal}
        onClose={() => {
          setIsValidationModalOpen(false);
          setSelectedPackageForModal(null);
        }}
        onSuccess={() => {
          setCurrentTab('admin-packages');
        }}
      />

      <NewVersionModal
        isOpen={isNewVersionModalOpen}
        packageItem={selectedPackageForModal}
        onClose={() => {
          setIsNewVersionModalOpen(false);
          setSelectedPackageForModal(null);
        }}
        onSuccess={updatedPkg => {
          setActivePackageId(updatedPkg.id);
          setCurrentTab('admin-edit-package');
        }}
      />

      <AiSettingsModal
        isOpen={isAiSettingsModalOpen}
        onClose={() => setIsAiSettingsModalOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
