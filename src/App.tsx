import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { SURFACE_SUBTLE } from './theme';
import hslIcon from './assets/branding/icon-dark.webp';
import { AdminInquiriesPage } from './pages/AdminInquiriesPage';
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PortalPage } from './pages/PortalPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AdminPage } from './pages/AdminPage';
import { AdminClientDetailPage } from './pages/AdminClientDetailPage';

// Public, standalone, and not linked from the main nav - lazy-loaded so it stays out of the
// main bundle and only downloads when someone opens the tool.
const TaskCostCalculatorPage = lazy(() =>
  import('./pages/tools/TaskCostCalculatorPage').then((m) => ({ default: m.TaskCostCalculatorPage })),
);

/** Matches the auth-gate splash in `ProtectedRoute` so the app only ever has one loading screen. */
function RouteFallback() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE, display: 'grid', placeItems: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
        <Box component="img" src={hslIcon} alt="Henderson Software Labs" sx={{ height: 36, width: 'auto' }} />
        <CircularProgress size={22} aria-label="Loading" />
      </Box>
    </Box>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<Suspense fallback={<RouteFallback />}><ContactPage /></Suspense>} />
          <Route path="/admin/inquiries" element={<ProtectedRoute requireAdmin><AdminInquiriesPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route
            path="/tools/task-cost-calculator"
            element={
              <Suspense fallback={<RouteFallback />}>
                <TaskCostCalculatorPage />
              </Suspense>
            }
          />
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <PortalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clients/:clientId"
            element={
              <ProtectedRoute requireAdmin>
                <AdminClientDetailPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
