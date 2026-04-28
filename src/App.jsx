import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import ClockInOptionsPage from '@/pages/ClockInOptionsPage';
import ClockInPage from '@/pages/ClockInPage';
import MonthlyClockInPage from '@/pages/MonthlyClockInPage';
import JustificationsPage from '@/pages/JustificationsPage';
import HistoryPage from '@/pages/HistoryPage';
import AdjustmentsPage from '@/pages/AdjustmentsPage';
import LoginPage from '@/pages/LoginPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import AdminManagementPage from '@/pages/AdminManagementPage';
import AdminRecordsPage from '@/pages/AdminRecordsPage';
import AdminJustificationsPage from '@/pages/AdminJustificationsPage';
import AdminAdjustmentsPage from '@/pages/AdminAdjustmentsPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminValidationPage from '@/pages/AdminValidationPage';
import OrganizationalAreaPage from '@/pages/OrganizationalAreaPage';
import DataAnalysisPage from '@/pages/DataAnalysisPage';
import FleetManagementPage from '@/pages/FleetManagementPage';
import RegisterFleetUsagePage from '@/pages/RegisterFleetUsagePage';
import FleetUsageGuidePage from '@/pages/FleetUsageGuidePage';
import EquipmentConditionPage from '@/pages/EquipmentConditionPage';
import FleetAdminDashboardPage from '@/pages/FleetAdminDashboardPage';
import FleetHistoryPage from '@/pages/FleetHistoryPage';
import FleetUsageHoursPage from '@/pages/FleetUsageHoursPage';
import FleetUsageSummaryPage from '@/pages/FleetUsageSummaryPage';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { HardHat } from 'lucide-react';
import AdminHistoryPage from '@/pages/AdminHistoryPage';
import TableEditorPage from '@/pages/TableEditorPage';
import UpdatesPage from '@/pages/UpdatesPage';
import AlertsPage from '@/pages/AlertsPage';
import AdminUserDeletionPage from '@/pages/AdminUserDeletionPage';
import { useLanguage } from '@/hooks/useLanguage';
import { useNotifications } from '@/contexts/NotificationContext';
import TestPanelPage from '@/pages/TestPanelPage';
import CentralDeLogsPage from '@/pages/CentralDeLogsPage';
import useHubspotTracking from '@/hooks/useHubspotTracking.js';

const LoadingScreen = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground">
      <HardHat className="mx-auto h-16 w-16 text-primary animate-bounce" />
      <p className="mt-4 text-lg">{t('common.loading')}</p>
    </div>
  );
};

const PermissionRoute = ({ permission, children }) => {
    const { hasPermission, loading } = useAdminPermissions();
    const { isAdmin } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }
    
    if (isAdmin && !hasPermission(permission)) {
        return <Navigate to="/admin/management" replace />;
    }

    return children;
};

const AppLayout = () => {
  const { user } = useAuth();
  const { isSubscribed, subscribe, permission } = useNotifications();
  
  useEffect(() => {
    if (import.meta.env.DEV) {
       console.log("[AppLayout] Shift cascade logic debugging initialized.");
    }
    
    if (user && permission === 'default' && !isSubscribed) {
       // subscribe().catch(console.error);
    }
  }, [user, permission, isSubscribed, subscribe]);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const AppRoutes = () => {
  const { user, isAuthenticated, loading, isAdmin, isAdminStar } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.senha_trocada) {
    return <Navigate to="/trocar-senha" state={{ from: location }} replace />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/registar-ponto" element={<ClockInOptionsPage />} />
        <Route path="/registar-ponto/diario" element={<ClockInPage />} />
        <Route path="/registar-ponto/mensal" element={<MonthlyClockInPage />} />
        <Route path="/justificacoes" element={<JustificationsPage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/ajustes" element={<AdjustmentsPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        
        {isAdmin && (
          <>
            <Route path="/admin/management" element={<AdminManagementPage />} />
            <Route path="/admin/validacoes" element={<PermissionRoute permission="can_view_validations"><AdminValidationPage /></PermissionRoute>} />
            <Route path="/admin/analise-dados" element={<PermissionRoute permission="can_view_data_analysis"><DataAnalysisPage /></PermissionRoute>} />
            <Route path="/admin/organizacional" element={<PermissionRoute permission="can_view_organizational"><OrganizationalAreaPage /></PermissionRoute>} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/registos" element={<AdminRecordsPage />} />
            <Route path="/admin/justificacoes" element={<AdminJustificationsPage />} />
            <Route path="/admin/correcoes" element={<AdminAdjustmentsPage />} />
            <Route path="/admin/historico" element={<AdminHistoryPage />} />
            <Route path="/admin/editar-tabelas" element={<TableEditorPage />} />
            <Route path="/admin/delete-users" element={<AdminUserDeletionPage />} />
          </>
        )}
        
        {isAdminStar && (
          <>
            <Route path="/admin/logs" element={<CentralDeLogsPage />} />
            <Route path="/admin/frotas" element={<FleetManagementPage />} />
            <Route path="/admin/frotas/registar" element={<RegisterFleetUsagePage />} />
            <Route path="/admin/frotas/guia" element={<FleetUsageGuidePage />} />
            <Route path="/admin/frotas/condicoes" element={<EquipmentConditionPage />} />
            <Route path="/admin/frotas/horas" element={<FleetUsageHoursPage />} />
            <Route path="/admin/frotas/resumo" element={<FleetUsageSummaryPage />} />
            <Route path="/admin/frotas/historico" element={<FleetHistoryPage />} />
            <Route path="/admin/frotas/dashboard" element={<FleetAdminDashboardPage />} />
            <Route path="/test-panel" element={<TestPanelPage />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  useHubspotTracking();

  return (
    <>
      <Helmet>
        <title>Manteivias</title>
        <meta name="description" content="Sistema de registo de ponto digital para trabalhadores da obra." />
        <body className="dark" />
      </Helmet>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/trocar-senha" element={<ChangePasswordPage />} />
        <Route path="/*" element={ <AppRoutes /> } />
      </Routes>
    </>
  );
}

export default App;