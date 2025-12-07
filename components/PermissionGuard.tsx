
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { permissionService } from '../services/permissionService';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  requiredPermission: string; // e.g. "salary:view:dept"
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  requiredPermission, 
  children, 
  fallback 
}) => {
  const { user } = useAuth();

  // Use the central service which handles Scope Hierarchy and Delegation
  const hasAccess = permissionService.hasPermission(user, requiredPermission);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50 rounded-lg border border-red-100">
      <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-700">權限不足 (403 Forbidden)</h3>
      <p className="text-sm text-red-600 mt-2">
        您缺少必要權限：<code className="bg-red-100 px-1 rounded">{requiredPermission}</code>
        <br />
        (系統已檢查您的角色、代理授權及權限範圍)
      </p>
    </div>
  );
};
