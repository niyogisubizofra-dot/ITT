import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(formData.email, formData.password);
      const role = res.data.user.role;
      if (role === 'CEO' || role === 'Chairman' || role === 'Admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const status = err.response?.status;
      const dataMsg = err.response?.data?.msg || err.response?.data?.error?.message || err.response?.data?.message;
      let errMsg = '';
      
      if (status === 500) {
        errMsg = `Server Error (500): ${dataMsg || 'Internal Server Error. Please verify your backend server is running and database connection is active.'}`;
      } else if (status === 400 || status === 401 || status === 403 || status === 404) {
        errMsg = `Login Failed: ${dataMsg || 'Invalid credentials or request error.'}`;
      } else if (err.message === 'Network Error' || !err.response) {
        errMsg = `Connection Failed: Please verify the backend server is running or VITE_API_URL is set correctly (${backendUrl}). Details: ${err.message}`;
      } else {
        errMsg = `Error: ${dataMsg || err.message || 'An unexpected error occurred.'}`;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: resetEmail });
      setMsg(res.data.msg);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error resetting password');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-brand-dark py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-primary rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-brand-accent rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="max-w-md w-full space-y-6 card relative z-10 fade-in">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-brand-text">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-brand-muted">
            Or{' '}
            <Link to="/register" className="font-medium text-brand-primary hover:text-blue-400 transition">
              create a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm text-center flex items-center justify-center">
            <AlertCircle className="w-4 h-4 mr-2" /> {error}
          </div>
        )}
        {msg && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg text-sm text-center">
            {msg}
          </div>
        )}

        {!forgotPassword ? (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-brand-muted" />
                </div>
                <input
                  name="email"
                  type="text"
                  required
                  className="input-field pl-10"
                  placeholder="Email address or Username"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-brand-muted" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-brand-muted hover:text-brand-primary focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button 
                  type="button" 
                  onClick={() => setForgotPassword(true)} 
                  className="font-medium text-brand-primary hover:text-blue-400"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex justify-center items-center py-2 mt-4"
              >
                {loading ? 'Signing in...' : (
                  <>Sign in <ArrowRight className="ml-2 h-5 w-5" /></>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
            <p className="text-brand-muted text-sm text-center">Enter your email address and we will send you instructions to reset your password.</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-brand-muted" />
              </div>
              <input
                type="email"
                required
                className="input-field pl-10"
                placeholder="Email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setForgotPassword(false)}
                className="w-1/2 btn-secondary py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 btn-primary py-2"
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
