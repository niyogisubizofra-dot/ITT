import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Wallet, Calendar, Copy, Check, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';

const WithdrawalSuccess = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const txId = id || searchParams.get('id');

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!txId) {
      setLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/deposit/transaction/${txId}`);
        setTransaction(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to retrieve withdrawal confirmation details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [txId]);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-400">Loading withdrawal confirmation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 text-white shadow-2xl">
          <AlertCircle className="w-14 h-14 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Access Error</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const txData = transaction || {
    amount: parseFloat(searchParams.get('amount') || 0),
    transactionId: searchParams.get('ref') || 'WITHDRAW-PROCESSED',
    date: new Date().toISOString(),
    method: 'BEP20-USDT',
    walletBalance: parseFloat(searchParams.get('balance') || 0),
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 py-12 relative overflow-hidden text-white">
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-2xl relative z-10 fade-in">
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <Logo size={36} />
            <span className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              I T T
            </span>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-black uppercase tracking-wider">
            Completed
          </span>
        </div>

        {/* Animated Celebration Section */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full border-4 border-emerald-500/30 shadow-lg shadow-emerald-500/10 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            🎉 Congratulations!
          </h1>
          <p className="text-sm text-emerald-400 font-semibold max-w-sm mx-auto leading-relaxed">
            Your withdrawal has been successfully processed, and the funds have been sent to your account.
          </p>
        </div>

        {/* Main Details Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-inner">
          <div className="text-center border-b border-slate-800 pb-4">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Withdrawal Amount</span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
              ${parseFloat(txData.amount).toFixed(2)} <span className="text-base text-slate-400 font-bold">USDT</span>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-medium">Transaction Reference</span>
              <div className="flex items-center space-x-2 font-mono font-bold text-slate-200">
                <span>{txData.transactionId}</span>
                <button
                  onClick={() => handleCopy(txData.transactionId)}
                  className="text-slate-400 hover:text-emerald-400 transition"
                  title="Copy Reference"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-medium">Date & Time</span>
              <span className="font-semibold text-slate-300">
                {new Date(txData.date).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-medium">Withdrawal Method</span>
              <span className="font-semibold text-slate-300">{txData.method || 'BEP20-USDT'}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-slate-800/80 pt-3">
              <span className="text-slate-400 font-medium">Remaining Wallet Balance</span>
              <span className="font-black text-white text-base">
                ${parseFloat(txData.walletBalance || 0).toFixed(2)} USDT
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link
            to="/dashboard"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition text-center text-sm flex items-center justify-center gap-2 border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Link
            to="/withdrawal-history"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl transition text-center text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            View Withdrawal History <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalSuccess;
