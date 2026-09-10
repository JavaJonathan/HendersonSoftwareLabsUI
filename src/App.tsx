import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ScrollToTop } from './components/layout/ScrollToTop';
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

function RouteFallback() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress aria-label="Loading" />
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
