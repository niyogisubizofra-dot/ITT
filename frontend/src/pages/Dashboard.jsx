import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';
import { 
  LayoutDashboard, CheckSquare, Bell, User, LogOut, 
  MessageSquare, Clock, CheckCircle2, 
  Wallet, TrendingUp, DollarSign, CreditCard,
  ArrowRight, Home, Menu, X, Users, Share2, Copy, Check, Zap,
  Image, Paperclip, Bold, Italic, Link2, Send, Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { mockChartData, mockNotifications, mockReferralStats, mockTasks } from '../data/mockData';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const activeInvestments = useAuthStore((state) => state.activeInvestments);
  const claimProfit = useAuthStore((state) => state.claimProfit);
  const removeInvestment = useAuthStore((state) => state.removeInvestment);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralData, setReferralData] = useState(mockReferralStats);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [countdowns, setCountdowns] = useState({});
  
  const [tasks, setTasks] = useState(mockTasks);
  const [notifications, setNotifications] = useState(mockNotifications);

  // Chart data state & dynamic loader
  const [chartData, setChartData] = useState(mockChartData);

  useEffect(() => {
    if (user && user.id) {
      axios.get('/api/referrals/stats')
        .then(res => {
          const txs = res.data.transactions;
          if (txs && txs.length > 0) {
            const sorted = [...txs].sort((a, b) => {
              const aTime = a.date ? new Date(a.date).getTime() : 0;
              const bTime = b.date ? new Date(b.date).getTime() : 0;
              return aTime - bTime;
            });
            let runningBalance = parseFloat(user.balance || 0);
            const totalDiff = txs.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
            let startBalance = runningBalance - totalDiff;

            const data = sorted.map(t => {
              startBalance += parseFloat(t.amount || 0);
              const dateObj = t.date ? new Date(t.date) : null;
              const name = dateObj && !isNaN(dateObj.getTime())
                ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
                : 'Date';
              return {
                name,
                value: parseFloat(startBalance.toFixed(2))
              };
            });
            setChartData(data);
          } else {
            setChartData(mockChartData);
          }
        })
        .catch(() => setChartData(mockChartData));
    }
  }, [user]);

  // Support Chat states & socket binding
  const [socket, setSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { senderId: 'support', senderName: 'Support Agent', text: 'Welcome to the support desk! How can I help you today?', createdAt: new Date().toISOString() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Load chat messages from the database
  useEffect(() => {
    if (activeTab === 'chat') {
      axios.get('/api/chat/history')
        .then(res => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            setChatMessages(res.data);
          } else {
            setChatMessages([
              { senderId: 'support', senderName: 'Support Agent', text: 'Welcome to the support desk! How can I help you today?', createdAt: new Date().toISOString() }
            ]);
          }
        })
        .catch(() => {
          setChatMessages([
            { senderId: 'support', senderName: 'Support Agent', text: 'Welcome to the support desk! How can I help you today?', createdAt: new Date().toISOString() }
          ]);
        });
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'chat' && user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || (
        window.location.origin === 'http://localhost:5173' 
          ? 'http://localhost:5000' 
          : window.location.origin
      );
      
      const newSocket = io(socketUrl, { withCredentials: true });
      setSocket(newSocket);

      newSocket.emit('joinChat', user.id);

      newSocket.on('receiveChatMessage', (message) => {
        setChatMessages((prev) => {
          // Prevent duplicates in state
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [activeTab, user]);

  const sendChatMessage = async (text = '', imageUrl = null) => {
    if (!text.trim() && !imageUrl) return;

    try {
      await axios.post('/api/chat/send', {
        receiverId: 1, // Admin is 1
        text,
        image: imageUrl
      });
      setChatInput('');
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'ChatAttachment');

    try {
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Send the uploaded image url via chat
      sendChatMessage('', res.data.path);
    } catch (err) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const insertRichText = (tag) => {
    let tagStart = '';
    let tagEnd = '';
    if (tag === 'bold') { tagStart = '**'; tagEnd = '**'; }
    else if (tag === 'italic') { tagStart = '*'; tagEnd = '*'; }
    else if (tag === 'link') { tagStart = '['; tagEnd = '](url)'; }

    setChatInput((prev) => prev + tagStart + 'text' + tagEnd);
  };

  const renderMessageText = (text) => {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-blue-200 hover:text-blue-100">$1</a>');

    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  };

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'dashboard');
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'referrals') {
      axios.get('/api/referrals/stats')
        .then(res => setReferralData(res.data))
        .catch(() => setReferralData(mockReferralStats));
    }
  }, [activeTab]);

  // Auto-claim profit at end of day
  useEffect(() => {
    if (!activeInvestments || activeInvestments.length === 0) return;

    const interval = setInterval(() => {
      activeInvestments.forEach((inv) => {
        if (inv.profitAdded) return;
        
        const dayEndTime = new Date(inv.investedAt).setHours(23, 59, 59, 999);
        const now = Date.now();
        
        // Auto-claim when day ends
        if (now >= dayEndTime) {
          claimProfit(inv.id);
        }
      });

      setCountdowns({...countdowns}); // Trigger re-render for countdown
    }, 1000);

    return () => clearInterval(interval);
  }, [activeInvestments, claimProfit]);

  const calculateTotalProfit = () => {
    if (!activeInvestments || activeInvestments.length === 0) return 0;
    return activeInvestments
      .filter(inv => inv.profitAdded)
      .reduce((total, inv) => total + parseFloat(inv.dailyProfit.replace('$', '')), 0)
      .toFixed(2);
  };

  const stats = [
    { label: 'Wallet Balance', value: `$${parseFloat(user?.balance || 0).toFixed(2)}`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Investments', value: activeInvestments?.length || 0, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Total Profit', value: `$${calculateTotalProfit()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Unread Alerts', value: notifications.length.toString(), icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const normalizedReferralData = {
    referralCode: referralData?.referralCode || 'INVEST-DEMO',
    totalReferrals: referralData?.totalReferrals || 0,
    levels: referralData?.levels || { 1: 0, 2: 0, 3: 0 },
    earnings: {
      registrationBonuses: referralData?.earnings?.registrationBonuses || 0,
      total: referralData?.earnings?.total || 0,
      level1: referralData?.earnings?.level1 || 0,
      level2: referralData?.earnings?.level2 || 0,
      level3: referralData?.earnings?.level3 || 0,
    },
    transactions: referralData?.transactions || [],
  };

  const handleDeposit = (amount) => {
    try {
      const current = user || { balance: 0 };
      const newBalance = (parseFloat(current.balance) || 0) + (parseFloat(amount) || 0);
      const newUser = { ...current, balance: newBalance };
      // update local Zustand state directly so UI reflects deposit immediately
      useAuthStore.setState({ user: newUser });
      setTasks((t) => [{ id: Date.now(), title: `Deposit $${amount}`, deadline: 'Today', status: 'Completed', priority: 'Low' }, ...t]);
      alert(`Successfully deposited $${parseFloat(amount).toFixed(2)}`);
    } catch (err) {
      console.error('Deposit failed', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans fixed inset-0 z-50">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - User Version */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 shadow-2xl md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-center border-b border-slate-800 relative">
          <button 
            className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-brand-primary overflow-hidden shadow-inner">
             <img src={`https://ui-avatars.com/api/?name=${user?.username}&background=2563eb&color=fff`} className="w-full h-full object-cover" alt="User" />
          </div>
          <h2 className="text-xl font-bold truncate">{user?.username || 'User'}</h2>
          <p className="text-slate-400 text-sm">Investor Account</p>
        </div>
        
        <nav className="flex-grow py-6 px-4 space-y-2 overflow-y-auto">
          <Link
            to="/"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all mb-4 border border-slate-800"
          >
            <Home className="w-5 h-5" />
            <span className="font-bold">Exit to Home</span>
          </Link>

          {[
            { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
            { id: 'investments', label: 'My Investments', icon: Zap },
            { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
            { id: 'referrals', label: 'Invite Friends', icon: Users },
            { id: 'notifications', label: 'Inbox & News', icon: Bell },
            { id: 'chat', label: 'Support Chat', icon: MessageSquare },
            { id: 'profile', label: 'My Profile', icon: User },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setSearchParams({ tab: item.id }); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:pl-6'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto w-full">
        <header className="bg-white shadow-sm px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between sticky top-0 z-20 border-b border-slate-100 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-3 p-2 text-slate-500 hover:text-brand-primary rounded-lg hover:bg-slate-50"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate max-w-[200px] sm:max-w-none">Welcome, {user?.username || 'User'}</h1>
          </div>
          <div className="flex items-center self-end sm:self-auto">
            <div className="flex space-x-2">
              <button onClick={() => setDepositOpen(true)} className="btn-primary px-4 py-2 text-sm flex items-center"><DollarSign className="w-4 h-4 mr-1" /> Deposit</button>
              <button onClick={() => setWithdrawOpen(true)} className="bg-slate-100 text-slate-700 px-4 py-2 text-sm rounded-lg font-bold hover:bg-slate-200 transition"><CreditCard className="w-4 h-4 mr-1" /> Withdraw</button>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-4 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <div className="fade-in space-y-8">
              {/* Global News Alert - Direct from Admin */}
              <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-lg sm:rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between relative overflow-hidden group gap-3">
                <div className="flex items-center space-x-2 sm:space-x-4 relative z-10 min-w-0">
                   <div className="bg-white/20 p-2 rounded-lg sm:rounded-xl flex-shrink-0">
                      <Bell className="w-4 h-4 sm:w-6 sm:h-6 animate-bounce" />
                   </div>
                   <div className="min-w-0">
                      <p className="font-black text-xs sm:text-sm uppercase tracking-widest opacity-80">Latest Update from Admin</p>
                      <p className="font-bold text-sm sm:text-base line-clamp-2 sm:line-clamp-none">System maintenance completed successfully. All trading pairs are now live.</p>
                   </div>
                </div>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 opacity-40 group-hover:translate-x-2 transition relative z-10 flex-shrink-0 hidden sm:block" />
                <div className="absolute top-0 right-0 w-32 sm:w-64 h-full bg-white/10 skew-x-[-20deg] translate-x-20 group-hover:translate-x-10 transition duration-1000"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {stats.map((s, i) => (
                  <div key={i} className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 group hover:shadow-xl transition duration-300">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                       <div className={`${s.bg} p-2 sm:p-3 rounded-lg sm:rounded-xl group-hover:scale-110 transition flex-shrink-0`}>
                          <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${s.color}`} />
                       </div>
                       <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 truncate">{s.value}</div>
                    <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1 line-clamp-2">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Chart and Recent Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
                      <TrendingUp className="w-6 h-6 mr-3 text-brand-primary" /> Portfolio Performance
                   </h3>
                   <div className="h-80 w-full relative">
                       <ResponsiveContainer width="99%" height="100%" key={`${activeTab}_${chartData.length}`}>
                         <LineChart data={Array.isArray(chartData) ? chartData : []}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                           <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }} />
                           <YAxis stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} tick={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }} />
                           <Tooltip 
                             contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontFamily: 'Inter, sans-serif', fontSize: 12 }}
                             itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                             labelStyle={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}
                           />
                           <Line 
                             type="monotone" 
                             dataKey="value" 
                             stroke="#2563eb" 
                             strokeWidth={4}
                             dot={{ fill: '#2563eb', strokeWidth: 2, r: 5 }}
                             activeDot={{ r: 8, strokeWidth: 0 }}
                           />
                         </LineChart>
                       </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                   <h3 className="text-xl font-bold text-slate-800 mb-8">Pending Tasks</h3>
                   <div className="space-y-4">
                      {tasks.filter(t => t.status !== 'Completed').map(t => (
                        <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-primary/30 transition">
                           <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                t.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                              }`}>{t.priority}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{t.deadline}</span>
                           </div>
                           <p className="font-bold text-slate-800">{t.title}</p>
                           <div className="mt-3 flex items-center text-xs text-brand-primary font-bold">
                              Go to task <ArrowRight className="w-3 h-3 ml-1" />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="fade-in space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center">
                  <Zap className="w-8 h-8 mr-3 text-yellow-500" /> My Active Investments
                </h2>

                {activeInvestments && activeInvestments.length > 0 ? (
                  <div className="space-y-6">
                    {activeInvestments.map((inv) => {
                      const investmentTime = new Date(inv.investedAt).getTime();
                      const dayEndTime = new Date(inv.investedAt).setHours(23, 59, 59, 999);
                      const timeRemaining = Math.max(0, dayEndTime - Date.now());
                      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
                      const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                      const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);

                      return (
                        <div key={inv.id} className="bg-gradient-to-r from-slate-50 to-blue-50 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl border border-slate-200 hover:shadow-lg transition">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 sm:mb-4">
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 truncate">{inv.name}</h3>
                              <p className="text-xs sm:text-sm text-slate-600 font-medium truncate">{inv.type}</p>
                            </div>
                            <span className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-widest flex-shrink-0 whitespace-nowrap ${
                              inv.profitAdded ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              {inv.profitAdded ? 'Profit Added' : 'Active'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-slate-100">
                              <p className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mb-0.5 sm:mb-1">Invested</p>
                              <p className="text-sm sm:text-base md:text-lg font-black text-slate-900 truncate">{inv.price}</p>
                            </div>
                            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-slate-100">
                              <p className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mb-0.5 sm:mb-1">Profit</p>
                              <p className="text-sm sm:text-base md:text-lg font-black text-emerald-600 truncate">{inv.dailyProfit}</p>
                            </div>
                            <div className="bg-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-slate-100">
                              <p className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mb-0.5 sm:mb-1">Time Left</p>
                              <p className="text-sm sm:text-base md:text-lg font-black text-blue-600 truncate">{hoursRemaining}h {minutesRemaining}m</p>
                            </div>
                          </div>

                          <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2 mb-3 sm:mb-4 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all"
                              style={{ width: `${((dayEndTime - Date.now()) / (24 * 60 * 60 * 1000)) * 100}%` }}
                            ></div>
                          </div>

                          <div className="flex gap-2 sm:gap-3">
                            {!inv.profitAdded && timeRemaining <= 0 ? (
                              <button
                                onClick={() => claimProfit(inv.id)}
                                className="flex-1 bg-emerald-500 text-white font-bold py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl hover:bg-emerald-600 transition flex items-center justify-center text-xs sm:text-sm md:text-base"
                              >
                                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" /> <span className="truncate">Claim {inv.dailyProfit} Profit</span>
                              </button>
                            ) : inv.profitAdded ? (
                              <button
                                onClick={() => removeInvestment(inv.id)}
                                className="flex-1 bg-slate-300 text-slate-700 font-bold py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl hover:bg-slate-400 transition text-xs sm:text-sm md:text-base"
                              >
                                Remove from List
                              </button>
                            ) : (
                              <button disabled className="flex-1 bg-slate-200 text-slate-500 font-bold py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl cursor-not-allowed text-xs sm:text-sm md:text-base">
                                Waiting for end of day...
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Zap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold mb-6">No active investments yet.</p>
                    <Link
                      to="/invest"
                      className="inline-block bg-brand-primary text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition"
                    >
                      Start Investing Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="fade-in bg-white p-10 rounded-2xl shadow-sm border border-slate-100">
               <h2 className="text-3xl font-black text-slate-800 mb-8">My Assignments</h2>
               <div className="space-y-6">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition">
                       <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${
                            t.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {t.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                             <p className="font-bold text-slate-800 text-lg">{t.title}</p>
                             <p className="text-sm text-slate-400 font-medium">Deadline: {t.deadline}</p>
                          </div>
                       </div>
                       <div className="flex items-center space-x-4">
                          <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                            t.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
                          }`}>{t.status}</span>
                          {t.status !== 'Completed' && (
                            <button className="btn-primary px-4 py-2 text-sm font-bold rounded-xl">Complete Task</button>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="fade-in max-w-3xl mx-auto space-y-6">
               <h2 className="text-3xl font-black text-slate-800 mb-8">Inbox & Updates</h2>
               {notifications.map(n => (
                 <div key={n.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start space-x-4 hover:shadow-md transition">
                    <div className={`p-3 rounded-2xl ${
                      n.type === 'broadcast' ? 'bg-blue-100 text-blue-600' : 
                      n.type === 'news' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Bell className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{n.type} notification</span>
                          <span className="text-xs text-slate-400 font-medium">{n.time}</span>
                       </div>
                       <p className="text-slate-800 font-bold text-lg leading-snug">{n.msg}</p>
                       <div className="mt-4 flex space-x-3">
                          <button className="text-brand-primary text-sm font-black uppercase tracking-widest hover:underline">Mark as read</button>
                          {n.type === 'broadcast' && <button className="text-slate-400 text-sm font-black uppercase tracking-widest hover:underline">View details</button>}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="fade-in h-[calc(100vh-140px)] md:h-[650px] bg-brand-secondary/40 border border-brand-border/30 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col font-sans">
               <div className="p-4 md:p-6 border-b border-brand-border/20 flex items-center justify-between bg-brand-secondary/60 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                     <div className="relative">
                        <img src="https://ui-avatars.com/api/?name=Support&background=2563eb&color=fff" className="w-10 h-10 rounded-full shadow-md border border-brand-border/30" alt="Support avatar" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-brand-secondary"></div>
                     </div>
                     <div>
                        <span className="font-bold text-brand-text block text-base leading-tight">Support Desk</span>
                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center mt-0.5">
                           Active Now
                        </span>
                     </div>
                  </div>
                  {/* Rich Text controls */}
                  <div className="flex items-center space-x-1 sm:space-x-2 bg-brand-dark/40 border border-brand-border/30 p-1 rounded-xl">
                     <button type="button" title="Bold text" onClick={() => insertRichText('bold')} className="p-2 hover:bg-brand-secondary/50 rounded-lg text-brand-text/70 hover:text-brand-text transition"><Bold className="w-4 h-4" /></button>
                     <button type="button" title="Italic text" onClick={() => insertRichText('italic')} className="p-2 hover:bg-brand-secondary/50 rounded-lg text-brand-text/70 hover:text-brand-text transition"><Italic className="w-4 h-4" /></button>
                     <button type="button" title="Add Link" onClick={() => insertRichText('link')} className="p-2 hover:bg-brand-secondary/50 rounded-lg text-brand-text/70 hover:text-brand-text transition"><Link2 className="w-4 h-4" /></button>
                  </div>
               </div>
               
               <div className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto bg-brand-dark/10 flex flex-col scrollbar-thin">
                  {chatMessages.map((msg, index) => {
                     const isSelf = msg.senderId === user?.id;
                     return (
                        <div key={index} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                           {!isSelf && (
                              <img src={`https://ui-avatars.com/api/?name=${msg.senderName}&background=2563eb&color=fff`} className="w-7 h-7 rounded-full mb-1 flex-shrink-0 shadow-md border border-brand-border/30" alt="avatar" />
                           )}
                           <div className={`relative px-4 py-2 sm:py-2.5 rounded-[18px] text-[15px] leading-tight font-sans shadow-md border ${
                              isSelf 
                              ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-br-[4px] border-brand-primary/20' 
                              : 'bg-brand-secondary text-brand-text border-brand-border/40 rounded-bl-[4px]'
                           } max-w-[70%]`}>
                              {msg.text && <p className="font-normal">{renderMessageText(msg.text)}</p>}
                              {msg.image && (
                                 <div className="mt-2 group relative overflow-hidden rounded-2xl border border-brand-border/30 bg-brand-dark/30 p-1.5 transition-all duration-300 hover:border-brand-primary/50">
                                    <div className="absolute top-2 left-2 z-10 bg-brand-primary/95 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-md">
                                       <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                       Market Analysis Chart
                                    </div>
                                    <a href={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
                                       <img 
                                          src={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} 
                                          alt="Uploaded chart analysis" 
                                          className="w-full max-w-[280px] sm:max-w-md object-cover transition-transform duration-500 group-hover:scale-105" 
                                       />
                                    </a>
                                 </div>
                              )}
                              <span className={`text-[8px] font-semibold block mt-1 uppercase tracking-tighter ${isSelf ? 'text-white/70 text-right' : 'text-brand-text/50'}`}>
                                 {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                        </div>
                     );
                  })}
               </div>

               <div className="p-4 bg-brand-secondary/60 border-t border-brand-border/20">
                  <div className="flex items-center space-x-2 bg-brand-dark/60 border border-brand-border/30 p-1.5 rounded-full shadow-inner">
                     {/* Image upload button */}
                     <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                     <button type="button" disabled={isUploading} onClick={() => fileInputRef.current.click()} className="p-2.5 hover:bg-brand-secondary/50 rounded-full transition text-brand-accent relative shrink-0">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-brand-accent" /> : <Image className="w-5 h-5" />}
                     </button>

                     <input 
                        type="text" 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(chatInput); }}
                        className="flex-grow bg-transparent border-none focus:ring-0 px-3 py-1.5 text-sm sm:text-base text-brand-text placeholder-brand-text/40 font-medium" 
                        placeholder="Type a message..." 
                     />
                     <button onClick={() => sendChatMessage(chatInput)} className="text-brand-accent hover:text-brand-primary p-2.5 hover:scale-105 active:scale-95 transition shrink-0">
                        <Send className="w-5 h-5 fill-current" />
                     </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'referrals' && !referralData && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
          )}

          {activeTab === 'referrals' && referralData && (
            <div className="fade-in space-y-8">
               <div className="bg-brand-primary text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                     <h2 className="text-3xl font-black mb-4">Invite & Earn Multi-Level Rewards</h2>
                     <p className="max-w-xl text-white/80 font-medium text-lg leading-relaxed mb-8">
                       Earn $0.10 for every friend you invite! They also receive a $0.05 Welcome Bonus. 
                       Plus, earn lifelong commissions on their investments across 3 levels: 7% (Level 1), 4% (Level 2), and 2% (Level 3).
                     </p>
                     <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between border border-white/20 backdrop-blur-md max-w-2xl">
                        <div className="flex items-center space-x-3 overflow-hidden">
                           <Share2 className="w-6 h-6 shrink-0" />
                           <span className="font-mono text-lg font-bold truncate">
                             {window.location.origin}/register?ref={normalizedReferralData.referralCode}
                           </span>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/register?ref=${normalizedReferralData.referralCode}`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="bg-white text-brand-primary px-6 py-3 rounded-xl font-black ml-4 shadow-lg active:scale-95 transition flex items-center shrink-0"
                        >
                          {copied ? <><Check className="w-5 h-5 mr-2" /> Copied</> : <><Copy className="w-5 h-5 mr-2" /> Copy Link</>}
                        </button>
                     </div>
                  </div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Stats Cards */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Referrals</span>
                       <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                       <span className="block text-4xl font-black text-slate-800">{normalizedReferralData.totalReferrals}</span>
                       <span className="text-sm text-slate-400 font-medium block mt-1">Friends registered</span>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Reg. Bonuses</span>
                       <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                       <span className="block text-4xl font-black text-slate-800">${normalizedReferralData.earnings.registrationBonuses.toFixed(2)}</span>
                       <span className="text-sm text-slate-400 font-medium block mt-1">From invites alone</span>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between border-b-4 border-b-brand-primary">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-brand-primary font-bold uppercase tracking-widest text-xs">Total Comms Income</span>
                       <TrendingUp className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                       <span className="block text-4xl font-black text-brand-primary">${normalizedReferralData.earnings.total.toFixed(2)}</span>
                       <span className="text-sm text-brand-primary/60 font-medium block mt-1">All investment commissions</span>
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Multi-Level Box */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                     <h3 className="text-xl font-bold text-slate-800 mb-6">Referral Network</h3>
                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                           <div>
                              <span className="block font-black text-slate-800">Level 1 <span className="text-sm font-bold text-slate-400 ml-2">(7% Comm)</span></span>
                              <span className="text-sm font-bold text-blue-600 block mt-1">{normalizedReferralData.levels[1]} Referrals</span>
                           </div>
                           <span className="font-black text-xl text-blue-700">${normalizedReferralData.earnings.level1.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                           <div>
                              <span className="block font-black text-slate-800">Level 2 <span className="text-sm font-bold text-slate-400 ml-2">(4% Comm)</span></span>
                              <span className="text-sm font-bold text-emerald-600 block mt-1">{normalizedReferralData.levels[2]} Referrals</span>
                           </div>
                           <span className="font-black text-xl text-emerald-700">${normalizedReferralData.earnings.level2.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                           <div>
                              <span className="block font-black text-slate-800">Level 3 <span className="text-sm font-bold text-slate-400 ml-2">(2% Comm)</span></span>
                              <span className="text-sm font-bold text-purple-600 block mt-1">{normalizedReferralData.levels[3]} Referrals</span>
                           </div>
                           <span className="font-black text-xl text-purple-700">${normalizedReferralData.earnings.level3.toFixed(2)}</span>
                        </div>
                     </div>
                  </div>

                  {/* Transactions Box */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                     <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-slate-400" /> Transaction History
                     </h3>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {normalizedReferralData.transactions.length === 0 ? (
                          <div className="text-center py-10 text-slate-500 font-medium">No transactions yet. Start inviting friends!</div>
                        ) : (
                          normalizedReferralData.transactions.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                               <div className="flex items-center space-x-4">
                                  <div className={`p-3 rounded-full flex shrink-0 ${
                                    t.type.includes('commission') ? 'bg-emerald-100 text-emerald-600' :
                                    t.type === 'referral_bonus' ? 'bg-blue-100 text-blue-600' :
                                    'bg-red-100 text-red-600'
                                  }`}>
                                     {t.type.includes('investment') ? <CreditCard className="w-5 h-5"/> : <TrendingUp className="w-5 h-5"/>}
                                  </div>
                                  <div>
                                     <span className="block font-bold text-slate-800 text-sm">{t.description}</span>
                                     <span className="text-xs text-slate-400 font-bold block mt-1">
                                       {new Date(t.date).toLocaleString()} • {t.type.replace('_', ' ').toUpperCase()}
                                     </span>
                                  </div>
                               </div>
                               <span className={`font-black tracking-tight shrink-0 pl-4 ${
                                 parseFloat(t.amount) > 0 ? 'text-emerald-500' : 'text-slate-800'
                               }`}>
                                 {parseFloat(t.amount) > 0 ? '+' : ''}{parseFloat(t.amount).toFixed(2)}
                               </span>
                            </div>
                          ))
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
        <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} onDeposit={handleDeposit} />
        <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} onDeposit={handleDeposit} />
        <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} balance={parseFloat(user?.balance || 0)} />
      </main>
    </div>
  );
};

export default Dashboard;
