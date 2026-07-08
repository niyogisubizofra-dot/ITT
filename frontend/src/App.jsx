import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// ── Eagerly loaded (critical path — needed on first paint) ───────────────────
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// ── Lazily loaded (only fetched when the user navigates there) ───────────────
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const About = lazy(() => import('./pages/About'));
const Invest = lazy(() => import('./pages/Invest'));

// ── Lightweight fallback while lazy chunks load ──────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-dark">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-brand-muted text-sm font-medium">Loading…</p>
    </div>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const isAdminUser = (user) => {
  return user.role === 'Admin';
};

const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (isAdminUser(user)) {
    return <Navigate to="/admin-dashboard" />;
  }
  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

const ManagerProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  const allowed = ['Admin'];
  if (!allowed.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

const RegisterProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">Loading...</div>;
  if (!user) return <Navigate to="/register" />;
  
  if (isAdminUser(user)) {
    return <Navigate to="/admin-dashboard" />;
  }
  return children;
};

const AuthRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">Loading...</div>;
  if (user) {
    if (isAdminUser(user)) {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAppDashboard = location.pathname === '/admin-dashboard' || location.pathname === '/dashboard';

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {!isAppDashboard && <Navbar />}
      <main className={`flex-grow ${isAppDashboard ? '' : 'pt-16'} bg-brand-dark transition-colors duration-300 flex flex-col`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route 
              path="/invest" 
              element={
                <RegisterProtectedRoute>
                  <Invest />
                </RegisterProtectedRoute>
              } 
            />
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <AdminProtectedRoute>
                  <ErrorBoundary>
                    <AdminDashboard />
                  </ErrorBoundary>
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/manager-dashboard" 
              element={
                <ManagerProtectedRoute>
                  <ErrorBoundary>
                    <ManagerDashboard />
                  </ErrorBoundary>
                </ManagerProtectedRoute>
              }
            />
            {/* Catch-all route mapping for any undefined pages */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {!isAuthPage && !isAppDashboard && <Footer />}
    </div>
  );
};

function App() {
  const checkUser = useAuthStore((state) => state.checkUser);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
