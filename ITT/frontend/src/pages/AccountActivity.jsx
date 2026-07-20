import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Calendar, ArrowLeft, RefreshCw, Activity, ArrowDownRight, ArrowUpRight, Repeat, TrendingUp, Award, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AccountActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/account-activity', {
        params: {
          search,
          category: categoryFilter,
          startDate,
          endDate,
          page,
          limit: 15,
        },
      });
      setActivities(res.data.activities || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch account activity', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, categoryFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchActivities();
  };

  const getActivityIcon = (cat, type) => {
    switch (cat) {
      case 'deposit':
        return <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20"><ArrowDownRight className="w-5 h-5" /></div>;
      case 'withdrawal':
        return <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20"><ArrowUpRight className="w-5 h-5" /></div>;
      case 'investment':
        return <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20"><Zap className="w-5 h-5" /></div>;
      case 'earnings':
        return <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20"><TrendingUp className="w-5 h-5" /></div>;
      case 'rewards':
        return <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20"><Award className="w-5 h-5" /></div>;
      case 'transfers':
        return <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20"><Repeat className="w-5 h-5" /></div>;
      default:
        return <div className="p-2.5 bg-slate-800 text-slate-300 rounded-xl border border-slate-700"><Activity className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 pt-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Account Activity</h1>
              <p className="text-xs sm:text-sm text-slate-400">Complete timeline of deposits, withdrawals, trades, investments & rewards</p>
            </div>
          </div>

          <button
            onClick={fetchActivities}
            className="self-start sm:self-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search activity description or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 appearance-none"
              >
                <option value="all">All Activities</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="investment">Investments & VIP</option>
                <option value="earnings">Daily Returns</option>
                <option value="transfers">Wallet Transfers</option>
                <option value="trades">Buy / Sell Trades</option>
                <option value="rewards">Rewards & Bonuses</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition"
            >
              Filter
            </button>
          </form>

          {/* Date Range Inputs */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
            />
            {(startDate || endDate || search || categoryFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter('all'); setStartDate(''); setEndDate(''); setPage(1); }}
                className="text-emerald-400 hover:underline font-semibold ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-400" />
              Loading account activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Activity className="w-10 h-10 mx-auto text-slate-600" />
              <p className="font-semibold text-slate-300">No activities recorded</p>
              <p className="text-xs text-slate-500">No account activity matches your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    {getActivityIcon(act.category, act.type)}
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">{act.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{act.description}</p>
                      <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-slate-500">
                        <span>{new Date(act.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{act.reference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right whitespace-nowrap">
                    <p className={`font-black text-sm sm:text-base ${act.category === 'withdrawal' ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {act.category === 'withdrawal' ? '-' : '+'}${typeof act.amount === 'number' ? act.amount.toFixed(2) : parseFloat(act.amount || 0).toFixed(2)}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                      {act.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span> ({total} items)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white border border-slate-800 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white border border-slate-800 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountActivity;
