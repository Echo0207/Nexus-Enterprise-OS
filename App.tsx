
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
        
        {/* Module C: HR Center (General Access for Leave, specific perms inside) */}
        <Route path="hr" element={<HRPage />} />

        {/* RBAC Test Page: Requires salary:view:dept */}
        <Route path="dept-salary" element={
            <PermissionGuard requiredPermission="salary:view:dept">
                <SalaryTestPage />
            </PermissionGuard>
        } />

        {/* Role Management: Requires admin:edit:roles */}
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
