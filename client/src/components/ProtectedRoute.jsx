import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './LoadingSpinner';
import { dashboardPath } from '../utils/format';

function loginPathFor(roles = []) {
  if (roles.includes('admin')) return '/admin/login';
  if (roles.includes('employer')) return '/employer/login';
  return '/login';
}

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return (
      <Navigate
        to={loginPathFor(roles)}
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}
