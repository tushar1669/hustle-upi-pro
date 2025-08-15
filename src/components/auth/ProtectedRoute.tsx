import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <img 
            src="/assets/Logo_hustlehub.png" 
            alt="HustleHub" 
            className="h-20 w-auto mx-auto"
          />
          <div className="text-lg font-medium text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to signin page, but save the attempted URL
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}