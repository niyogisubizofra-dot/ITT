import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import Logo from './Logo';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const WithdrawModal = ({ open, onClose, balance }) => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const handleClose = () => {
    setAddress('');
    setAmount('');
    setPin('');
    setError('');
    setSuccess('');
    onClose && onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post('/api/withdraw', {
        amount: parseFloat(amount),
        address: address.trim(),
        method: 'BEP20-USDT',
      });
      
      setSuccess(`Your withdrawal request of $${parseFloat(amount).toFixed(2)} USDT has been submitted successfully and is awaiting admin approval.`);
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      const data = err.response?.data;
      const msg =
        (Array.isArray(data?.errors) && data.errors.map((e) => e.message).join(', ')) ||
        (typeof data?.error === 'string' && data.error) ||
        data?.msg ||
        err.message ||
        'Failed to submit withdrawal.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative bg-slate-900 text-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden z-10">
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Logo size={36} />
              <div>
                <h3 className="text-xl font-bold">Withdraw</h3>
                <p className="text-xs text-slate-400">Available (USDT)</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500 text-emerald-400 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <div className="bg-slate-800 rounded-3xl p-5 text-center mb-6">
            <p className="text-sm text-slate-400">Available (USDT)</p>
            <p className="text-4xl font-black text-emerald-400 mt-2">
              {typeof balance === 'number' ? balance.toFixed(6) : '0.000000'}
            </p>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-white mb-3">Select network</h4>
            <div className="grid grid-cols-1 gap-3">
              <button className="w-full bg-emerald-400 text-slate-900 font-bold rounded-2xl py-3 flex items-center justify-center gap-2">
                <Logo size={20} /> BEP20-USDT
              </button>
            </div>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Withdraw address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  type="text"
                  placeholder="Paste or enter address"
                  className="w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Withdraw amount</label>
                <div className="relative rounded-3xl border border-slate-700 bg-slate-950/80">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    min="1"
                    step="0.000001"
                    max={typeof balance === 'number' ? balance : undefined}
                    placeholder="Amount"
                    className="w-full rounded-3xl bg-transparent px-4 py-3 text-white outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(typeof balance === 'number' ? balance.toFixed(6) : '')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm"
                  >
                    All
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">Min withdraw: 1.000000 USDT. Max withdraw: unrestricted.</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Security PIN</label>
                <div className="relative rounded-3xl border border-slate-700 bg-slate-950/80">
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    type="password"
                    placeholder="Security PIN"
                    className="w-full rounded-3xl bg-transparent px-4 py-3 text-white outline-none"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">•••</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-3xl bg-emerald-400 text-slate-900 font-black py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'OK'}
              </button>
            </form>
          ) : (
            <button
              onClick={handleClose}
              className="w-full rounded-3xl bg-slate-700 text-white font-bold py-4 text-lg hover:bg-slate-600 transition"
            >
              Close
            </button>
          )}

          <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950/80 p-4 text-slate-300 text-sm space-y-3">
            <p className="font-bold text-white">Withdrawal rules</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400">
              <li>Minimum withdrawal amount:</li>
              <li>BEP20/Polygon: 1 USDT</li>
              <li>TRC20: 10 USDT</li>
              <li>TRX: 100 TRX</li>
              <li>Maximum withdrawal amount: unrestricted</li>
              <li>Each user is restricted to one withdrawal per day.</li>
              <li>The interval between two withdrawals should be at least 24 hours.</li>
              <li>Transaction fee: 0</li>
            </ul>
            <p className="text-slate-400">Please confirm whether you meet the withdrawal conditions before withdrawing. Thank you for your support.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
