import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Invest from './pages/Invest';
import AdminDashboard from './pages/AdminDashboard';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  const isAdmin = user.username === 'ishimwe' || user.email.includes('ishimwe') || user.email.includes('admin');
  if (isAdmin) {
    return <Navigate to="/admin-dashboard" />;
  }
  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  const isAdmin = user.username === 'ishimwe' || user.email.includes('ishimwe') || user.email.includes('admin');
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

const RegisterProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">Loading...</div>;
  if (!user) return <Navigate to="/register" />;
  
  const isAdmin = user.username === 'ishimwe' || user.email.includes('ishimwe') || user.email.includes('admin');
  if (isAdmin) {
    return <Navigate to="/admin-dashboard" />;
  }
  return children;
};

const AuthRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-dark text-brand-text">Loading...</div>;
  if (user) {
    const isAdmin = user.username === 'ishimwe' || user.email.includes('ishimwe') || user.email.includes('admin');
    if (isAdmin) {
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
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          {/* Catch-all route mapping for any undefined pages */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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

