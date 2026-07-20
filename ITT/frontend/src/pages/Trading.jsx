import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { 
  ArrowLeft, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  DollarSign, 
  RefreshCw, 
  AlertCircle,
  Coins,
  History,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import axios from 'axios';

const Trading = () => {
  const user = useAuthStore((state) => state.user);
  const checkUser = useAuthStore((state) => state.checkUser);
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(true);
  const [tradingEnabled, setTradingEnabled] = useState(true);
  const [wallet, setWallet] = useState({ balance: 0, totalInvested: 0 });
  const [coins, setCoins] = useState([]);
  const [portfolio, setPortfolio] = useState({ holdings: [], summary: { totalPortfolioValue: 0, totalInvested: 0, totalProfitLoss: 0, totalROI: 0 } });
  const [transactions, setTransactions] = useState([]);
  
  // Modals state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferType, setTransferType] = useState('deposit'); // 'deposit' or 'withdrawal'
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [tradeAmount, setTradeAmount] = useState(''); // USDT for buy, coin qty for sell
  const [tradeConfirm, setTradeConfirm] = useState(false);
  const [tradeError, setTradeError] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);

  // Fetch all trading data
  const fetchData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      // 1. Get status & wallet
      const statusRes = await axios.get('/api/trading/status');
      setTradingEnabled(statusRes.data.enabled);
      setWallet(statusRes.data.wallet);

      if (statusRes.data.enabled) {
        // 2. Get active coins
        const coinsRes = await axios.get('/api/trading/coins');
        setCoins(coinsRes.data.coins);

        // 3. Get portfolio
        const portfolioRes = await axios.get('/api/trading/portfolio');
        setPortfolio(portfolioRes.data);

        // 4. Get transactions
        const txRes = await axios.get('/api/trading/transactions');
        setTransactions(txRes.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load trading data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    // Refresh prices every 15 seconds
    const timer = setInterval(() => {
      fetchData(false);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Handle Wallet Transfer (Deposit/Withdraw)
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setTransferError('');
    const amt = parseFloat(transferAmount);

    if (isNaN(amt) || amt <= 0) {
      setTransferError('Please enter a valid amount greater than zero.');
      return;
    }

    if (transferType === 'deposit' && amt > parseFloat(user?.balance || 0)) {
      setTransferError('Insufficient main account balance.');
      return;
    }

    if (transferType === 'withdrawal' && amt > wallet.balance) {
      setTransferError('Insufficient trading wallet balance.');
      return;
    }

    setTransferLoading(true);
    try {
      const endpoint = transferType === 'deposit' ? '/api/trading/transfer/deposit' : '/api/trading/transfer/withdraw';
      const res = await axios.post(endpoint, { amount: amt });
      
      // Update local state and authStore user profile to sync main balance
      await checkUser();
      await fetchData(false);
      
      setTransferAmount('');
      setTransferOpen(false);
      alert(res.data.msg || 'Transfer completed successfully.');
    } catch (err) {
      setTransferError(err.response?.data?.error || 'Transfer failed. Please try again.');
    } finally {
      setTransferLoading(false);
    }
  };

  // Open Trade Modal
  const openTradeModal = (type, coin) => {
    setTradeType(type);
    setSelectedCoin(coin);
    setTradeAmount('');
    setTradeError('');
    setTradeConfirm(false);
    setTradeOpen(true);
  };

  // Handle Trade Submit
  const handleTradeSubmit = async (e) => {
    e.preventDefault();
    setTradeError('');
    const val = parseFloat(tradeAmount);

    if (isNaN(val) || val <= 0) {
      setTradeError(`Please enter a valid ${tradeType === 'buy' ? 'USDT amount' : 'quantity'}.`);
      return;
    }

    if (tradeType === 'buy') {
      if (val > wallet.balance) {
        setTradeError('Insufficient trading wallet balance.');
        return;
      }
    } else {
      const holding = portfolio.holdings.find(h => h.coinId === selectedCoin.id);
      if (!holding || val > holding.quantity) {
        setTradeError('Insufficient coin holdings.');
        return;
      }
    }

    if (!tradeConfirm) {
      setTradeConfirm(true);
      return;
    }

    setTradeLoading(true);
    try {
      const endpoint = tradeType === 'buy' ? '/api/trading/buy' : '/api/trading/sell';
      const payload = tradeType === 'buy' 
        ? { coinId: selectedCoin.id, amount: val } 
        : { coinId: selectedCoin.id, quantity: val };
        
      const res = await axios.post(endpoint, payload);
      await fetchData(false);
      setTradeOpen(false);
      alert(res.data.msg || 'Order executed successfully.');
    } catch (err) {
      setTradeError(err.response?.data?.error || 'Order execution failed. Please try again.');
      setTradeConfirm(false);
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading Trading Module...</p>
        </div>
      </div>
    );
  }

  if (!tradingEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
          <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-4">Trading Unavailable</h2>
          <p className="text-slate-400 font-medium mb-8">
            Trading is currently unavailable. Please check back later.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculated Portfolio value
  const totalPortfolioValue = portfolio.summary.totalPortfolioValue;
  const totalInvested = wallet.totalInvested;
  const availableBalance = wallet.balance;
  const netValue = totalPortfolioValue + availableBalance;
  
  // profitLoss: totalPortfolioValue - totalInvested
  const overallPL = portfolio.summary.totalProfitLoss;
  const overallROI = portfolio.summary.totalROI;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Crypto Trading Hub</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">ITT Platform Feature</p>
            </div>
          </div>
          
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Main Balance:</span>
            <span className="text-sm font-black text-emerald-400">${parseFloat(user?.balance || 0).toFixed(2)}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Wallet + Portfolio Info */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Trading Wallet Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-full bg-blue-500/5 skew-x-[-20deg] translate-x-12 group-hover:translate-x-6 transition duration-1000"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="bg-blue-600/10 p-3 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-500" />
              </div>
              <button 
                onClick={() => setTransferOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transfer Funds</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Available Trading Balance</p>
            <h2 className="text-3xl font-black text-white mb-6">${availableBalance.toFixed(2)}</h2>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Invested</p>
                <p className="text-base font-black text-slate-300">${totalInvested.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Portfolio Value</p>
                <p className="text-base font-black text-slate-300">${totalPortfolioValue.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/80">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Account Net</p>
                <p className="text-base font-black text-blue-400">${netValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Profit/Loss</p>
                <div className={`flex items-center text-sm font-black ${overallPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {overallPL >= 0 ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                  <span>${overallPL.toFixed(2)} ({overallROI.toFixed(2)}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Position List */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-blue-500" />
              <span>Current Portfolio Holdings</span>
            </h3>

            {portfolio.holdings.length === 0 ? (
              <div className="text-center py-10">
                <Coins className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-semibold">No coins owned yet.</p>
                <p className="text-xs text-slate-600 mt-1">Use your trading balance to buy coins.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.holdings.map((h) => (
                  <div key={h.id} className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{h.name}</span>
                        <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">{h.symbol}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Qty: <strong className="text-slate-300">{h.quantity.toFixed(4)}</strong>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Avg Buy: ${h.averageBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-white">${h.currentValue.toFixed(2)}</p>
                      <div className={`flex items-center justify-end text-xs font-bold ${h.profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'} mt-1`}>
                        {h.profitLoss >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                        <span>${h.profitLoss.toFixed(2)} ({h.roi.toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Crypto Markets & Coin Listing */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Coin Prices Panel */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Coins className="w-5 h-5 text-blue-500" />
                <span>Crypto Markets</span>
              </h3>
              <button 
                onClick={() => fetchData(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-400 hover:text-white"
                title="Refresh Prices"
              >
                <RefreshCw className="w-4 h-4 animate-hover" />
              </button>
            </div>

            {coins.length === 0 ? (
              <p className="text-center py-10 text-slate-500">No coins are currently active.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-black">Asset</th>
                      <th className="pb-3 text-right font-black">Price</th>
                      <th className="pb-3 text-right font-black">24h Change</th>
                      <th className="pb-3 text-center font-black">Market Status</th>
                      <th className="pb-3 text-right font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((c) => {
                      const change = parseFloat(c.priceChangePercent);
                      const isUp = c.isUp;
                      
                      return (
                        <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition group">
                          <td className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-slate-800 w-9 h-9 rounded-xl flex items-center justify-center font-black text-blue-500 group-hover:scale-105 transition">
                                {c.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm">{c.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{c.symbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <p className="font-black text-white text-sm">
                              ${parseFloat(c.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                            </p>
                            <p className="text-[8px] text-slate-600 mt-0.5">Vol: {c.volatility.toUpperCase()}</p>
                          </td>
                          <td className="py-4 text-right">
                            <div className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-lg ${
                              isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
                            }`}>
                              {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                              <span>{isUp ? '+' : '-'}{Math.abs(change).toFixed(2)}%</span>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              c.marketStatus === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {c.marketStatus}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                disabled={c.marketStatus !== 'open'}
                                onClick={() => openTradeModal('buy', c)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                                  c.marketStatus === 'open' 
                                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                                  : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-transparent'
                                }`}
                              >
                                Buy
                              </button>
                              <button 
                                disabled={c.marketStatus !== 'open'}
                                onClick={() => openTradeModal('sell', c)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                                  c.marketStatus === 'open'
                                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                                  : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-transparent'
                                }`}
                              >
                                Sell
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transaction History Section */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
              <History className="w-5 h-5 text-blue-500" />
              <span>Transaction History</span>
            </h3>

            {transactions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-semibold">
                No transactions completed yet.
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === 'buy' ? 'bg-blue-500/10 text-blue-400' :
                        tx.type === 'sell' ? 'bg-emerald-500/10 text-emerald-400' :
                        tx.type === 'deposit' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tx.type === 'buy' && <ArrowUpRight className="w-4 h-4" />}
                        {tx.type === 'sell' && <ArrowDownRight className="w-4 h-4" />}
                        {tx.type === 'deposit' && <CheckCircle2 className="w-4 h-4" />}
                        {tx.type === 'withdrawal' && <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white capitalize">
                          {tx.type === 'deposit' ? 'Transfer In' : tx.type === 'withdrawal' ? 'Transfer Out' : `${tx.type} ${tx.coin}`}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(tx.createdAt).toLocaleString()} • Ref: {tx.reference}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-white">
                        {tx.type === 'buy' || tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toFixed(2)}
                      </p>
                      {tx.type !== 'deposit' && tx.type !== 'withdrawal' && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {tx.quantity.toFixed(4)} Qty @ ${tx.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── TRANSFER MODAL (DEPOSIT/WITHDRAW) ────────────────────────────────── */}
      {transferOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setTransferOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-sm font-bold"
            >
              Close
            </button>
            <h3 className="text-lg font-black text-white mb-6">Transfer Funds</h3>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setTransferType('deposit'); setTransferError(''); }}
                className={`py-2 px-4 rounded-lg font-bold text-xs transition duration-200 ${
                  transferType === 'deposit' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white'
                }`}
              >
                Deposit (Main → Trading)
              </button>
              <button
                type="button"
                onClick={() => { setTransferType('withdrawal'); setTransferError(''); }}
                className={`py-2 px-4 rounded-lg font-bold text-xs transition duration-200 ${
                  transferType === 'withdrawal' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white'
                }`}
              >
                Withdraw (Trading → Main)
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Amount (USDT)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 pl-9 pr-4 text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Balance Indicators */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Available Main Balance:</span>
                  <span className="text-slate-300 font-black">${parseFloat(user?.balance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Available Trading Balance:</span>
                  <span className="text-slate-300 font-black">${availableBalance.toFixed(2)}</span>
                </div>
              </div>

              {transferError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={transferLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center space-x-2"
              >
                {transferLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Execute Transfer</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── BUY/SELL ORDER MODAL ────────────────────────────────────────────── */}
      {tradeOpen && selectedCoin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setTradeOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-sm font-bold"
            >
              Cancel
            </button>

            <div className="flex items-center space-x-2 mb-6">
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                tradeType === 'buy' ? 'bg-blue-600/10 text-blue-400' : 'bg-emerald-600/10 text-emerald-400'
              }`}>
                {tradeType} Order
              </span>
              <h3 className="text-lg font-black text-white">
                {selectedCoin.name} ({selectedCoin.symbol})
              </h3>
            </div>

            <form onSubmit={handleTradeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                  {tradeType === 'buy' ? 'Spend USDT' : 'Sell Quantity'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {tradeType === 'buy' ? <DollarSign className="h-4 w-4 text-slate-500" /> : <Coins className="h-4 w-4 text-slate-500" />}
                  </div>
                  <input
                    type="number"
                    step={tradeType === 'buy' ? '0.01' : '0.00000001'}
                    min={tradeType === 'buy' ? '0.01' : '0.00000001'}
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 pl-9 pr-4 text-white focus:outline-none focus:border-blue-500 text-sm"
                    placeholder={tradeType === 'buy' ? '0.00 USDT' : '0.0000 Qty'}
                    required
                    disabled={tradeConfirm}
                  />
                </div>
              </div>

              {/* Real-time details */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-855 text-xs space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Current Price:</span>
                  <span className="text-slate-300 font-black">
                    ${parseFloat(selectedCoin.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </span>
                </div>
                {tradeType === 'buy' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Estimated Qty:</span>
                      <span className="text-blue-400 font-black">
                        {tradeAmount ? (parseFloat(tradeAmount) / parseFloat(selectedCoin.currentPrice)).toFixed(6) : '0.000000'} {selectedCoin.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-850">
                      <span className="text-slate-500 font-semibold">Available Trading Cash:</span>
                      <span className="text-slate-300 font-black">${availableBalance.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Estimated Proceeds:</span>
                      <span className="text-emerald-400 font-black">
                        {tradeAmount ? `$${(parseFloat(tradeAmount) * parseFloat(selectedCoin.currentPrice)).toFixed(2)}` : '$0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-850">
                      <span className="text-slate-500 font-semibold">Available Holding Qty:</span>
                      <span className="text-slate-300 font-black">
                        {(portfolio.holdings.find(h => h.coinId === selectedCoin.id)?.quantity || 0).toFixed(6)} {selectedCoin.symbol}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {tradeError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{tradeError}</span>
                </div>
              )}

              {/* Confirmation Dialog Details */}
              {tradeConfirm && (
                <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl text-xs">
                  <p className="font-bold text-white mb-2">Confirm Order Details</p>
                  <p className="text-slate-400 leading-relaxed">
                    You are executing a <strong>{tradeType.toUpperCase()}</strong> order for{' '}
                    <strong>{selectedCoin.name}</strong>.
                    {tradeType === 'buy' 
                      ? ` This will deduct $${parseFloat(tradeAmount).toFixed(2)} from your trading wallet.`
                      : ` This will sell ${parseFloat(tradeAmount).toFixed(6)} of your holdings for an estimated $${(parseFloat(tradeAmount) * parseFloat(selectedCoin.currentPrice)).toFixed(2)} USDT.`
                    }
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-3">Click submit again to confirm execution.</p>
                </div>
              )}

              <div className="flex space-x-3">
                {tradeConfirm && (
                  <button
                    type="button"
                    onClick={() => setTradeConfirm(false)}
                    className="w-1/2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition"
                  >
                    Modify
                  </button>
                )}
                <button
                  type="submit"
                  disabled={tradeLoading}
                  className={`font-bold py-3 rounded-xl text-xs transition duration-200 flex items-center justify-center space-x-2 ${
                    tradeConfirm ? 'w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white' : 'w-full bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {tradeLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{tradeConfirm ? 'Confirm & Execute' : `Place ${tradeType === 'buy' ? 'Buy' : 'Sell'} Order`}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trading;
