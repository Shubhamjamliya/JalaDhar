import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { hasAdminPermission } from '../utils/permissionUtils';
import toast from 'react-hot-toast';

/**
 * Protected Route Component for Admins
 * Enforces Authentication and Granular RBAC Module Permissions.
 * If unauthorized, shows a toast and redirects to dashboard.
 */
export default function AdminProtectedRoute({ children, requiredPermission, requiredRole }) {
  const { isAuthenticated, loading, admin } = useAdminAuth();

  const isRoleDenied = Boolean(
    requiredRole &&
    admin?.role !== requiredRole &&
    admin?.role !== 'SUPER_ADMIN' &&
    admin?.role !== 'ADMIN'
  );

  const isPermissionDenied = Boolean(
    requiredPermission &&
    !hasAdminPermission(admin, requiredPermission)
  );

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isRoleDenied) {
        toast.dismiss();
        toast.error(`Access Denied: Requires ${requiredRole.replace(/_/g, ' ')} clearance.`);
      } else if (isPermissionDenied) {
        toast.dismiss();
        const formattedModule = requiredPermission.replace(/_/g, ' ').replace(/-/g, ' ').toUpperCase();
        toast.error(`Access Denied: You do not have permission to access '${formattedModule}'.`);
      }
    }
  }, [loading, isAuthenticated, isRoleDenied, isPermissionDenied, requiredRole, requiredPermission]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7F9]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/adminlogin" replace />;
  }

  if (isRoleDenied || isPermissionDenied) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

