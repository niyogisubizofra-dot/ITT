import { Zap, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

const InvestmentProgressCard = ({ investment }) => {
  if (!investment) return null;

  const {
    plan = 'VIP Investment',
    amount = 0,
    dailyProfit = 0,
    totalProfit = 0,
    totalExpectedReturn = 0,
    remainingDays = 32,
    durationDays = 32,
    status = 'Running',
    startDate,
  } = investment;

  const investedNum = parseFloat(amount || 0);
  const totalReturnNum = parseFloat(totalExpectedReturn || (dailyProfit * durationDays) || (investedNum * 1.52));
  const currentEarningsNum = parseFloat(totalProfit || 0);
  const daysCompleted = Math.max(0, durationDays - remainingDays);

  // Percentage progress (0 to 100)
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysCompleted / durationDays) * 100)));

  const getStatusBadge = () => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5" /> Completed
        </span>
      );
    }
    if (status === 'Expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertCircle className="w-3.5 h-3.5" /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
        <Zap className="w-3.5 h-3.5 fill-cyan-400" /> Running
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-5">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-cyan-500/20">
            {plan.slice(0, 3)}
          </div>
          <div>
            <h3 className="text-lg font-black text-white">{plan}</h3>
            <p className="text-xs text-slate-400">Daily yield: <span className="font-semibold text-emerald-400">+${parseFloat(dailyProfit).toFixed(2)} USDT</span></p>
          </div>
        </div>

        {getStatusBadge()}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-1">Investment</span>
          <span className="text-base font-black text-white">${investedNum.toFixed(2)}</span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Current Earnings</span>
          <span className="text-base font-black text-emerald-400">+${currentEarningsNum.toFixed(2)}</span>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <span className="text-slate-400 block mb-1">Expected Return</span>
          <span className="text-base font-black text-cyan-400">${totalReturnNum.toFixed(2)}</span>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> Progress: <span className="text-white">{daysCompleted} / {durationDays} Days</span>
          </span>
          <span className="text-slate-400 font-normal">
            Remaining: <span className="font-bold text-amber-400">{remainingDays} Days</span>
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-sm shadow-emerald-400/30"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>Started: {startDate ? new Date(startDate).toLocaleDateString('en-US') : 'Day 1'}</span>
          <span>{progressPercent}% Completed</span>
        </div>
      </div>
    </div>
  );
};

export default InvestmentProgressCard;
