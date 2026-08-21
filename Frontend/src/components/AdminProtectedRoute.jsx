import { Navigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { hasAdminPermission } from '../utils/permissionUtils';
import { IoShieldOutline, IoArrowBackOutline, IoLockClosedOutline } from 'react-icons/io5';

/**
 * Protected Route Component for Admins
 * Enforces Authentication and Granular RBAC Module Permissions
 */
export default function AdminProtectedRoute({ children, requiredPermission, requiredRole }) {
  const { isAuthenticated, loading, admin } = useAdminAuth();

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

  // 1. Role-based check (if specified)
  if (requiredRole && admin?.role !== requiredRole && admin?.role !== 'SUPER_ADMIN' && admin?.role !== 'ADMIN') {
    return <AccessDeniedView admin={admin} reason={`This section requires the ${requiredRole.replace(/_/g, ' ')} role.`} />;
  }

  // 2. Granular Module Permission check (if specified)
  if (requiredPermission && !hasAdminPermission(admin, requiredPermission)) {
    return (
      <AccessDeniedView 
        admin={admin} 
        requiredPermission={requiredPermission} 
        reason={`You do not have permission to access the '${requiredPermission.toUpperCase()}' module.`} 
      />
    );
  }

  return children;
}

function AccessDeniedView({ admin, requiredPermission, reason }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600 text-3xl shadow-sm">
          <IoLockClosedOutline />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-rose-100/70 text-rose-700 font-bold text-[11px] rounded-full uppercase tracking-wider">
            403 • Access Denied
          </span>
          <h2 className="text-xl font-black text-gray-900">Restricted Module</h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            {reason || "Your administrative account does not have sufficient clearance to view or manage this section."}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span>Logged in as:</span>
            <strong className="text-gray-900 font-semibold">{admin?.name || 'Admin'}</strong>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Assigned Role:</span>
            <strong className="text-blue-600 font-semibold">{admin?.role?.replace(/_/g, ' ') || 'Staff'}</strong>
          </div>
          {requiredPermission && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Required Clearance:</span>
              <strong className="text-rose-600 font-semibold uppercase">{requiredPermission}</strong>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            to="/admin/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20"
          >
            <IoArrowBackOutline className="text-base" />
            <span>Return to Admin Dashboard</span>
          </Link>
          <p className="text-[11px] text-gray-400">
            Need access? Contact your organization's <strong className="text-gray-600">Super Admin</strong> to request module clearance.
          </p>
        </div>
      </div>
    </div>
  );
}

