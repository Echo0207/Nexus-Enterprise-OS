
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RoleManagementPage } from './pages/RoleManagementPage';
import { PermissionGuard } from './components/PermissionGuard';
import { Dashboard } from './pages/Dashboard';
import { SalaryTestPage } from './pages/SalaryTestPage';
import { HRPage } from './pages/HRPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Module C: HR Center */}
        <Route path="hr" element={<HRPage />} />

        {/* Module D: Knowledge Base */}
        <Route path="knowledge" element={<KnowledgeBasePage />} />

        {/* RBAC Test Page */}
        <Route path="dept-salary" element={
            <PermissionGuard requiredPermission="salary:view:dept">
                <SalaryTestPage />
            </PermissionGuard>
        } />

        {/* Role Management */}
        <Route path="settings/roles" element={
            <PermissionGuard requiredPermission="admin:edit:roles">
                <RoleManagementPage />
            </PermissionGuard>
        } />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
