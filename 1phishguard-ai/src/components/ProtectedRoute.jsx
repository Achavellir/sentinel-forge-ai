import { Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, Skeleton } from './ui';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-navy px-4">
        <Card className="w-full max-w-md">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-cyan" aria-hidden="true" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-3 w-full" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
