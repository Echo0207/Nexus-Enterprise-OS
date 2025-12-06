
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  requiredPermission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Implements the Middleware Logic described in 2.2.2 of the PDF
 * Checks exact match or wildcard match (e.g., "salary:view:all" covers "salary:view:dept")
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  requiredPermission, 
  children, 
  fallback 
}) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback || null}</>;
  }

  const hasPermission = () => {
    // 1. Check Exact Match
    if (user.permissions.includes(requiredPermission)) {
      return true;
    }

    // 2. Check Wildcard/Higher Privilege
    // Example: If user has 'salary:view:all', they can access 'salary:view:dept'
    // Logic: Split by ':' and check hierarchy. 
    // Simplified logic for this demo based on the PDF's specific example:
    // "salary:view:all" covers "salary:view:dept"
    
    if (requiredPermission === 'salary:view:dept' && user.permissions.includes('salary:view:all')) {
        return true;
    }

    // Superuser check (optional, usually implied by having all permissions)
    if (user.roles.includes('admin')) {
        return true;
    }

    return false;
  };

  if (hasPermission()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default Forbidden UI
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-50 rounded-lg border border-red-100">
      <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-700">權限不足 (403 Forbidden)</h3>
      <p className="text-sm text-red-600 mt-2">
        您沒有權限執行此動作。<br/>
        缺少權限: <code className="bg-red-100 px-1 rounded">{requiredPermission}</code>
      </p>
    </div>
  );
};
