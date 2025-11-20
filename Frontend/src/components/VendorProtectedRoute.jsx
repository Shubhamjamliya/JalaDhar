import { Navigate } from 'react-router-dom';
import { useVendorAuth } from '../contexts/VendorAuthContext';

/**
 * Protected Route Component for Vendors
 * Redirects to login if vendor is not authenticated
 */
export default function VendorProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useVendorAuth();

  if (loading) {
    // Show loading spinner while checking auth
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7F9]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A84FF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/vendorlogin" replace />;
  }

  return children;
}

