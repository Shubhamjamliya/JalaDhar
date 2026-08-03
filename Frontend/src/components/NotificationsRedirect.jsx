import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVendorAuth } from '../contexts/VendorAuthContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import LoadingSpinner from '../modules/shared/components/LoadingSpinner';

export default function NotificationsRedirect() {
  const navigate = useNavigate();
  const { isAuthenticated: isUserAuth } = useAuth();
  const { isAuthenticated: isVendorAuth } = useVendorAuth();
  const { isAuthenticated: isAdminAuth } = useAdminAuth();

  useEffect(() => {
    if (isAdminAuth) {
      navigate('/admin/notifications', { replace: true });
    } else if (isUserAuth) {
      navigate('/user/notifications', { replace: true });
    } else if (isVendorAuth) {
      navigate('/vendor/notifications', { replace: true });
    } else {
      navigate('/userlogin', { replace: true });
    }
  }, [isUserAuth, isVendorAuth, isAdminAuth, navigate]);

  return <LoadingSpinner message="Redirecting to notifications..." />;
}
