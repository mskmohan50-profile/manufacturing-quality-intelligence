import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { Sidebar, MobileNav, type Page } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { UploadPage } from '@/components/upload/UploadPage';
import { RecordsPage } from '@/components/records/RecordsPage';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { AuditLogsPage } from '@/components/audit/AuditLogsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { Skeleton } from '@/components/ui/Skeleton';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const map: Record<string, Page> = {
        d: 'dashboard',
        u: 'upload',
        r: 'records',
        e: 'reports',
        a: 'audit',
      };
      if (map[key]) {
        e.preventDefault();
        setPage(map[key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  const handleUploadComplete = () => {
    setRefreshKey((k) => k + 1);
    setPage('dashboard');
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage key={refreshKey} onNavigate={(p) => setPage(p)} />;
      case 'upload':
        return <UploadPage onUploadComplete={handleUploadComplete} />;
      case 'records':
        return <RecordsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage key={refreshKey} onNavigate={(p) => setPage(p)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav currentPage={page} onNavigate={setPage} />
        <div className="hidden md:block">
          <Header />
        </div>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
