import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: new URLSearchParams(useLocation().search).get('ref') || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await register(formData.username, formData.email, formData.password, formData.referralCode);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      // If multiple validation errors, join them all
      const allErrors = Array.isArray(data?.errors)
        ? data.errors.map((e) => e.message).join(' | ')
        : null;
      const dataMsg =
        allErrors ||
        (typeof data?.error === 'string' && data.error) ||
        data?.msg ||
        data?.message ||
        data?.error?.message;
      let errMsg = '';

      if (status === 500) {
        errMsg = `Server Error (500): ${dataMsg || 'Internal Server Error. Please verify your backend server is running and database connection is active.'}`;
      } else if (status === 400 || status === 401 || status === 403 || status === 404) {
        errMsg = `Registration Failed: ${dataMsg || 'Request error.'}`;
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

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-brand-dark py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-primary rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-accent rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="max-w-md w-full space-y-6 card relative z-10 fade-in">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-brand-text">
            Create your account
          </h2>
          {formData.referralCode && (
            <p className="mt-2 text-center text-sm text-emerald-400 font-bold bg-emerald-400/10 py-1 rounded-full px-2">
              Referral Code Active! You will receive a $0.05 Welcome Bonus.
            </p>
          )}
          <p className="mt-2 text-center text-sm text-brand-muted">
            Or{' '}
            <Link to="/login" className="font-medium text-brand-primary hover:text-blue-400 transition">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-brand-muted" />
              </div>
              <input
                name="username"
                type="text"
                required
                className="input-field pl-10"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-brand-muted" />
              </div>
              <input
                name="email"
                type="email"
                required
                className="input-field pl-10"
                placeholder="Email address"
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
                type="password"
                required
                className="input-field pl-10"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <p className="text-xs text-brand-muted mt-1 pl-1">Minimum 6 characters</p>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-brand-muted" />
              </div>
              <input
                name="confirmPassword"
                type="password"
                required
                className="input-field pl-10"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-brand-muted" />
              </div>
              <input
                name="referralCode"
                type="text"
                className="input-field pl-10 border-brand-primary/50 focus:border-brand-primary bg-brand-primary/5"
                placeholder="Referral Code (Optional)"
                value={formData.referralCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex justify-center items-center py-2 mt-4"
            >
              {loading ? 'Creating account...' : (
                <>Sign up <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
