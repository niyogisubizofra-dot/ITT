import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ArrowLeft, ShieldCheck, Building2 } from 'lucide-react';

const ManagerDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/40 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-gradient-to-tr from-emerald-400 to-blue-500 p-[2px] shadow-lg">
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">Manager Dashboard</h1>
        <p className="text-slate-500 font-medium mb-2">
          Welcome, <span className="font-bold text-slate-800">{user?.username}</span>
        </p>
        <p className="text-sm text-slate-400 mb-8 flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4" /> Role: {user?.role || 'Manager'}
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 text-left">
          <p className="text-slate-700 font-medium">
            Manager-level features are being configured. Please use the Admin Control Center for full administrative access, or return to your user dashboard.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> User Dashboard
          </button>
          <button
            onClick={async () => { await logout(); navigate('/'); }}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-primary to-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
