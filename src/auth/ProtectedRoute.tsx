import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from './useAuth';
import { SURFACE_SUBTLE } from '../theme';
import hslIcon from '../assets/branding/icon-dark.webp';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // The first thing a returning signed-in user sees while the token is revalidated.
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE, display: 'grid', placeItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
          <Box component="img" src={hslIcon} alt="Henderson Software Labs" sx={{ height: 36, width: 'auto' }} />
          <CircularProgress size={22} aria-label="Loading" />
        </Box>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}
