import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingPage } from '../shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCooperativeUser?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireCooperativeUser = false,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireCooperativeUser && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
