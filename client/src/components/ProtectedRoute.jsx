import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ role, children }) {
  const { auth, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!auth?.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && auth.user?.role !== role) {
    const fallback = auth.user?.role === 'teacher' ? '/teacher' : '/student';
    return <Navigate to={fallback} replace />;
  }
  return children;
}
