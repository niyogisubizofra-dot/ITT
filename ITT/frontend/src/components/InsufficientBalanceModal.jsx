import { X, AlertCircle } from 'lucide-react';

const InsufficientBalanceModal = ({ open, onClose, requiredAmount, productName, onRecharge }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 md:p-8 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-full flex-shrink-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Insufficient Balance</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 flex-shrink-0">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-sm sm:text-base text-slate-600">
              To invest in <span className="font-bold text-slate-900">{productName}</span>, you need an additional:
            </p>
            <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200">
              <p className="text-center text-xl sm:text-2xl font-black text-red-600">${requiredAmount}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200 space-y-2">
            <p className="text-xs sm:text-sm font-bold text-slate-700">How it works:</p>
            <ol className="text-xs sm:text-sm text-slate-600 space-y-1 list-decimal list-inside">
              <li>Click "Recharge Account" to deposit</li>
              <li>Send funds to your wallet via BNB Smart Chain</li>
              <li>Upload proof screenshot to admin via WhatsApp</li>
              <li>Admin verifies (1-10 minutes)</li>
              <li>Automatic return to payment screen</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={onRecharge}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition text-sm sm:text-base"
            >
              Recharge Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsufficientBalanceModal;
