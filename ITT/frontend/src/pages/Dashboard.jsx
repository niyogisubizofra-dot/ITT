import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';
import useDashboardStore from '../store/dashboardStore';
import { 
  LayoutDashboard, CheckSquare, Bell, User, LogOut, 
  MessageSquare, Clock, CheckCircle2, 
  Wallet, TrendingUp, DollarSign, CreditCard,
  ArrowRight, ArrowDownRight, ArrowUpRight, Home, Menu, X, Users, Share2, Copy, Check, Zap,
  Image, Paperclip, Bold, Italic, Link2, Send, Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import InvestmentProgressCard from '../components/InvestmentProgressCard';
import NotificationCenterModal from '../components/NotificationCenterModal';

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
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [countdowns, setCountdowns] = useState({});

  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dbInvestments, setDbInvestments] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchDbInvestments = async () => {
    try {
      const res = await axios.get('/api/invest/my-investments');
      setDbInvestments(res.data.investments || []);
    } catch (err) {
      console.error('Failed to fetch user investments', err);
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const res = await axios.get('/api/notifications');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to fetch user notifications', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      axios.get('/api/tasks/my-tasks')
        .then(res => setTasks(res.data))
        .catch(err => console.error('Failed to fetch user tasks', err));
      fetchNotifications();
      fetchDbInvestments();
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'tasks') {
      setTasksLoading(true);
      axios.get('/api/tasks/my-tasks')
        .then(res => {
          setTasks(res.data);
          setTasksLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch tasks', err);
          setTasksLoading(false);
        });
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    } else if (activeTab === 'investments') {
      fetchDbInvestments();
    }
  }, [activeTab]);

  const [completingTaskId, setCompletingTaskId] = useState(null);
  const handleCompleteTask = async (taskId) => {
    setCompletingTaskId(taskId);
    try {
      const res = await axios.put(`/api/tasks/my-tasks/${taskId}/complete`);
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: 'done', completedAt: res.data.completedAt } : t))
      );
    } catch (err) {
      alert('Failed to complete task.');
    } finally {
      setCompletingTaskId(null);
    }
  };

  // ── Cached dashboard store data ──────────────────────────────────────────
  const referralData = useDashboardStore((s) => s.referralData);
  const chartData = useDashboardStore((s) => s.chartData);
  const fetchReferralStats = useDashboardStore((s) => s.fetchReferralStats);
  const fetchChartData = useDashboardStore((s) => s.fetchChartData);

  // Fetch chart data once when user is available (cached after first load)
  useEffect(() => {
    if (user && user.id) {
      fetchChartData(user.balance);
    }
  }, [user?.id]);

  // Support Chat states & socket binding
  const [socket, setSocket] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [searchMessageQuery, setSearchMessageQuery] = useState('');
  const fileInputRef = useRef(null);

  // ── Cached chat store data ───────────────────────────────────────────────
  const chatMessages = useDashboardStore((s) => s.chatMessages);
  const userConversations = useDashboardStore((s) => s.userConversations);
  const activeConversationId = useDashboardStore((s) => s.activeConversationId);
  const fetchUserConversations = useDashboardStore((s) => s.fetchUserConversations);
  const createUserConversation = useDashboardStore((s) => s.createUserConversation);
  const fetchConversationMessages = useDashboardStore((s) => s.fetchConversationMessages);
  const markConversationRead = useDashboardStore((s) => s.markConversationRead);
  const appendChatMessage = useDashboardStore((s) => s.appendChatMessage);

  // Fetch conversations list when chat tab opens
  useEffect(() => {
    if (activeTab === 'chat') {
      fetchUserConversations();
    }
  }, [activeTab]);

  // Load chat messages when active conversation changes
  useEffect(() => {
    if (activeTab === 'chat' && activeConversationId) {
      fetchConversationMessages(activeConversationId);
      markConversationRead(activeConversationId);
    }
  }, [activeTab, activeConversationId]);

  useEffect(() => {
    if (activeTab === 'chat' && user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
      const newSocket = io(socketUrl, { withCredentials: true });
      setSocket(newSocket);

      newSocket.emit('joinChat', user.id);

      newSocket.on('receiveChatMessage', (message) => {
        appendChatMessage(message);
        if (Number(message.conversationId) === Number(activeConversationId)) {
          markConversationRead(activeConversationId);
        }
      });

      newSocket.on('ticketStatusChanged', ({ id, status }) => {
        fetchUserConversations();
        if (Number(id) === Number(activeConversationId)) {
          fetchConversationMessages(activeConversationId);
        }
      });
      
      newSocket.on('ticketAssigned', ({ id, assignedAdminId, assignedAdminName }) => {
        fetchUserConversations();
        if (Number(id) === Number(activeConversationId)) {
          fetchConversationMessages(activeConversationId);
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [activeTab, user, activeConversationId]);

  const sendChatMessage = async (text = '', imageUrl = null, fileUrl = null, fileName = null) => {
    if ((!text.trim() && !imageUrl && !fileUrl) || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await axios.post('/api/chat/send', {
        conversationId: activeConversationId,
        text,
        image: imageUrl,
        fileUrl,
        fileName,
      });
      setChatInput('');
    } catch (err) {
      alert('Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const fileType = file.type;
    const isImage = fileType.startsWith('image/');

    try {
      const res = await axios.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (isImage) {
        sendChatMessage('', res.data.fileUrl);
      } else {
        sendChatMessage('', null, res.data.fileUrl, res.data.fileName);
      }
    } catch (err) {
      alert('Failed to upload file. Please try again.');
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
    const parts = [];
    let remaining = text;
    let key = 0;

    const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|\[(.*?)\]\((.*?)\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={key++}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={key++}>{match[3]}</em>);
      } else if (match[4] && match[5]) {
        parts.push(<a key={key++} href={match[5]} target="_blank" rel="noopener noreferrer" className="underline text-blue-200 hover:text-blue-100">{match[4]}</a>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < remaining.length) {
      parts.push(remaining.slice(lastIndex));
    }

    return <span>{parts}</span>;
  };

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'dashboard');
  }, [searchParams]);

  // Fetch referral stats when tab opens (cached — skips if data is fresh)
  useEffect(() => {
    if (activeTab === 'referrals') {
      fetchReferralStats();
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

      setCountdowns(prev => ({...prev})); // Trigger re-render for countdown
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
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all mb-2 border border-slate-800"
          >
            <Home className="w-5 h-5" />
            <span className="font-bold">Exit to Home</span>
          </Link>

          <Link
            to="/trading"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all mb-4 border border-slate-800"
          >
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-blue-400">Crypto Trading</span>
          </Link>

          <Link
            to="/deposit-history"
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition-all text-sm font-medium"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
            <span>Deposit History</span>
          </Link>

          <Link
            to="/withdrawal-history"
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-all text-sm font-medium"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
            <span>Withdrawal History</span>
          </Link>

          <Link
            to="/account-activity"
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all text-sm font-medium mb-3"
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Account Activity</span>
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
                       {tasks.filter(t => t.status !== 'Completed' && t.status !== 'done').map(t => (
                         <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-primary/30 transition">
                            <div className="flex items-center justify-between mb-2">
                               <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                 t.priority?.toLowerCase() === 'high' || t.priority?.toLowerCase() === 'critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                               }`}>{t.priority}</span>
                               <span className="text-[10px] text-slate-400 font-bold">{t.dueDate || t.deadline || 'No deadline'}</span>
                            </div>
                            <p className="font-bold text-slate-800">{t.title}</p>
                            <button
                              onClick={() => { setSearchParams({ tab: 'tasks' }); setActiveTab('tasks'); }}
                              className="mt-3 flex items-center text-xs text-brand-primary font-bold hover:underline"
                            >
                               Go to task <ArrowRight className="w-3 h-3 ml-1" />
                            </button>
                         </div>
                       ))}
                       {tasks.filter(t => t.status !== 'Completed' && t.status !== 'done').length === 0 && (
                         <p className="text-sm font-semibold text-slate-400 text-center py-6">All tasks completed!</p>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="fade-in space-y-8">
              <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-6 md:p-8 text-white">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3">
                    <Zap className="w-7 h-7 text-yellow-400 fill-yellow-400" /> My VIP Investments
                  </h2>
                  <Link
                    to="/invest"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition"
                  >
                    + New Investment
                  </Link>
                </div>

                {dbInvestments && dbInvestments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dbInvestments.map((inv) => (
                      <InvestmentProgressCard key={inv.id} investment={inv} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <Zap className="w-14 h-14 text-slate-700 mx-auto" />
                    <p className="text-slate-400 font-semibold">No active investments found.</p>
                    <Link
                      to="/invest"
                      className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl transition shadow-lg shadow-emerald-500/20"
                    >
                      Start 32-Day Investment Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="fade-in bg-white p-10 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-3xl font-black text-slate-800 mb-8">My Assignments</h2>
                {tasksLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                     {tasks.map(t => {
                       const isDone = t.status === 'Completed' || t.status === 'done';
                       return (
                         <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition gap-4">
                            <div className="flex items-center space-x-4">
                               <div className={`p-3 rounded-xl ${
                                 isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                               }`}>
                                 {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                               </div>
                               <div>
                                  <p className="font-bold text-slate-800 text-lg leading-tight">{t.title}</p>
                                  {t.description && <p className="text-sm text-slate-500 mt-1">{t.description}</p>}
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                                    Deadline: {t.dueDate || t.deadline || 'No deadline'}
                                  </p>
                               </div>
                            </div>
                            <div className="flex items-center space-x-4 self-end sm:self-auto">
                               <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                                 isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
                               }`}>{isDone ? 'Completed' : t.status}</span>
                               {!isDone && (
                                 <button
                                   disabled={completingTaskId === t.id}
                                   onClick={() => handleCompleteTask(t.id)}
                                   className="btn-primary px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                                 >
                                   {completingTaskId === t.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                   {completingTaskId === t.id ? 'Processing...' : 'Complete Task'}
                                 </button>
                               )}
                            </div>
                         </div>
                       );
                     })}
                     {tasks.length === 0 && (
                       <p className="text-center py-10 text-slate-400 font-bold">No assignments yet.</p>
                     )}
                  </div>
                )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="fade-in max-w-3xl mx-auto space-y-6">
               <h2 className="text-3xl font-black text-slate-800 mb-8">Inbox & Updates</h2>
               {notificationsLoading && (
                 <div className="flex justify-center py-10">
                   <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                 </div>
               )}
               {!notificationsLoading && notifications.map(n => (
                 <div key={n.id} className={`bg-white p-6 rounded-2xl shadow-sm border flex items-start space-x-4 hover:shadow-md transition ${n.isRead ? 'border-slate-100 opacity-75' : 'border-brand-primary/30 shadow-sm'}`}>
                    <div className={`p-3 rounded-2xl ${
                      n.type === 'error' ? 'bg-red-100 text-red-600' :
                      n.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                      n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <Bell className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                       <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{n.type || 'info'} notification</span>
                          <span className="text-xs text-slate-400 font-medium">{new Date(n.createdAt).toLocaleString()}</span>
                       </div>
                       <h4 className="font-bold text-slate-800 text-base">{n.title}</h4>
                       <p className="text-slate-600 font-medium text-sm leading-snug mt-1">{n.message}</p>
                       <div className="mt-4 flex space-x-3">
                          {!n.isRead && (
                            <button 
                              onClick={() => handleMarkRead(n.id)}
                              className="text-brand-primary text-sm font-black uppercase tracking-widest hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteNotification(n.id)}
                            className="text-red-500 text-sm font-black uppercase tracking-widest hover:underline"
                          >
                            Delete
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
               {!notificationsLoading && notifications.length === 0 && (
                 <p className="text-center py-10 text-slate-400 font-bold">No notifications found.</p>
               )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="fade-in h-[calc(100vh-140px)] md:h-[650px] bg-brand-secondary/40 border border-brand-border/30 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-row font-sans">
               {/* Left Panel: Conversations list */}
               <div className="w-80 border-r border-brand-border/20 flex flex-col h-full bg-brand-dark/20 shrink-0">
                  <div className="p-4 border-b border-brand-border/20 flex items-center justify-between shrink-0">
                     <span className="font-bold text-brand-text text-sm">Support Tickets</span>
                     <button 
                        onClick={() => setShowNewTicketModal(true)} 
                        className="bg-brand-primary text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-brand-primary/80 transition"
                     >
                        New Chat
                     </button>
                  </div>
                  <div className="flex-grow overflow-y-auto p-2 space-y-2">
                     {userConversations.map((conv) => {
                        const isActive = conv.id === activeConversationId;
                        return (
                           <div 
                              key={conv.id}
                              onClick={() => {
                                 useDashboardStore.setState({ activeConversationId: conv.id });
                              }}
                              className={`p-3 rounded-2xl cursor-pointer transition border text-left block w-full ${
                                 isActive 
                                    ? 'bg-brand-primary/25 border-brand-primary/40 text-brand-text' 
                                    : 'hover:bg-brand-secondary/40 border-transparent text-brand-text/70'
                              }`}
                           >
                              <div className="flex items-center justify-between mb-1">
                                 <span className="font-bold truncate text-sm max-w-[120px]">{conv.subject}</span>
                                 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full leading-none shrink-0 ${
                                    conv.status === 'Open' ? 'bg-blue-500/20 text-blue-400' :
                                    conv.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                    conv.status === 'Resolved' ? 'bg-green-500/20 text-green-400' :
                                    'bg-slate-500/20 text-slate-400'
                                 }`}>
                                    {conv.status}
                                 </span>
                              </div>
                              <p className="text-xs text-brand-text/50 truncate mb-1">
                                 {conv.lastMessage || 'No messages yet'}
                              </p>
                              <span className="text-[9px] text-brand-text/40 block text-right">
                                 {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                           </div>
                        );
                     })}
                     {userConversations.length === 0 && (
                        <div className="p-8 text-center text-brand-text/40 text-xs">
                           No support conversations yet. Create one to ask for help!
                        </div>
                     )}
                  </div>
               </div>

               {/* Right Panel: Chat message area */}
               <div className="flex-grow flex flex-col h-full bg-brand-dark/10">
                  {activeConversationId ? (
                     <>
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-brand-border/20 flex items-center justify-between bg-brand-secondary/60 backdrop-blur-sm shrink-0">
                           <div className="flex items-center space-x-3">
                              <div className="relative">
                                 <img src="https://ui-avatars.com/api/?name=Support&background=2563eb&color=fff" className="w-10 h-10 rounded-full shadow-md border border-brand-border/30" alt="Support avatar" />
                                 <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-brand-secondary"></div>
                              </div>
                              <div className="text-left">
                                 <div className="flex items-center space-x-2">
                                    <span className="font-bold text-brand-text block text-base leading-tight">
                                       {userConversations.find(c => c.id === activeConversationId)?.subject || 'Support Chat'}
                                    </span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                       userConversations.find(c => c.id === activeConversationId)?.status === 'Open' ? 'bg-blue-500/20 text-blue-400' :
                                       userConversations.find(c => c.id === activeConversationId)?.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                       userConversations.find(c => c.id === activeConversationId)?.status === 'Resolved' ? 'bg-green-500/20 text-green-400' :
                                       'bg-slate-500/20 text-slate-400'
                                    }`}>
                                       {userConversations.find(c => c.id === activeConversationId)?.status}
                                    </span>
                                 </div>
                                 <span className="text-[10px] text-brand-text/50 font-medium">
                                    {userConversations.find(c => c.id === activeConversationId)?.assignedAdminName 
                                       ? `Agent: ${userConversations.find(c => c.id === activeConversationId)?.assignedAdminName}` 
                                       : 'Waiting for Admin Assignment'}
                                 </span>
                              </div>
                           </div>
                           <div className="flex items-center space-x-2">
                              <input 
                                 type="text" 
                                 placeholder="Search messages..."
                                 value={searchMessageQuery}
                                 onChange={(e) => setSearchMessageQuery(e.target.value)}
                                 className="bg-brand-dark/40 border border-brand-border/30 rounded-xl px-3 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-primary"
                              />
                              <div className="hidden sm:flex items-center space-x-1 bg-brand-dark/40 border border-brand-border/30 p-1 rounded-xl">
                                 <button type="button" title="Bold text" onClick={() => insertRichText('bold')} className="p-2 hover:bg-brand-secondary/50 rounded-lg text-brand-text/70 hover:text-brand-text transition"><Bold className="w-4 h-4" /></button>
                                 <button type="button" title="Italic text" onClick={() => insertRichText('italic')} className="p-2 hover:bg-brand-secondary/50 rounded-lg text-brand-text/70 hover:text-brand-text transition"><Italic className="w-4 h-4" /></button>
                                 <button type="button" title="Add Link" onClick={() => insertRichText('link')} className="p-2 hover:bg-brand-secondary/50 rounded-lg text-brand-text/70 hover:text-brand-text transition"><Link2 className="w-4 h-4" /></button>
                              </div>
                           </div>
                        </div>
 
                        {/* Message History */}
                        <div className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto flex flex-col scrollbar-thin">
                           {chatMessages
                              .filter(m => !searchMessageQuery || m.text?.toLowerCase().includes(searchMessageQuery.toLowerCase()))
                              .map((msg, index) => {
                                 const isSelf = msg.senderId === user?.id;
                                 return (
                                    <div key={index} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                                       {!isSelf && (
                                          <img src={`https://ui-avatars.com/api/?name=${msg.senderName || 'Admin'}&background=2563eb&color=fff`} className="w-7 h-7 rounded-full mb-1 flex-shrink-0 shadow-md border border-brand-border/30" alt="avatar" />
                                       )}
                                       <div className={`relative px-4 py-2 sm:py-2.5 rounded-[18px] text-[15px] leading-tight font-sans shadow-md border text-left ${
                                          isSelf 
                                          ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-br-[4px] border-brand-primary/20' 
                                          : 'bg-brand-secondary text-brand-text border-brand-border/40 rounded-bl-[4px]'
                                       } max-w-[70%]`}>
                                          {msg.text && <p className="font-normal">{renderMessageText(msg.text)}</p>}
                                          {msg.image && (
                                             <div className="mt-2 group relative overflow-hidden rounded-2xl border border-brand-border/30 bg-brand-dark/30 p-1.5 transition-all duration-300 hover:border-brand-primary/50">
                                                <a href={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
                                                   <img 
                                                      src={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} 
                                                      alt="Uploaded chart analysis" 
                                                      className="w-full max-w-[280px] sm:max-w-md object-cover transition-transform duration-500 group-hover:scale-105" 
                                                   />
                                                </a>
                                             </div>
                                          )}
                                          {msg.fileUrl && (
                                             <div className="mt-2 flex items-center space-x-2 bg-brand-dark/40 border border-brand-border/20 p-3 rounded-xl hover:border-brand-primary transition">
                                                <Paperclip className="w-5 h-5 text-brand-accent flex-shrink-0" />
                                                <div className="overflow-hidden flex-grow mr-4">
                                                   <span className="text-xs font-bold text-brand-text block truncate">{msg.fileName || 'Attachment'}</span>
                                                </div>
                                                <a 
                                                   href={msg.fileUrl.startsWith('http') ? msg.fileUrl : `/${msg.fileUrl}`} 
                                                   download={msg.fileName}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="text-xs font-black uppercase text-brand-accent hover:underline flex-shrink-0"
                                                >
                                                   Download
                                                </a>
                                             </div>
                                          )}
                                          <div className="flex items-center justify-end space-x-1 mt-1 text-[8px] tracking-tighter uppercase font-semibold">
                                             <span className={isSelf ? 'text-white/70' : 'text-brand-text/50'}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                             </span>
                                             {isSelf && (
                                                <span className="text-white/85 text-[8px]">
                                                   {msg.isRead ? ' • Read' : ' • Sent'}
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                        </div>
 
                        {/* Input bar */}
                        <div className="p-4 bg-brand-secondary/60 border-t border-brand-border/20 shrink-0">
                           <div className="flex items-center space-x-2 bg-brand-dark/60 border border-brand-border/30 p-1.5 rounded-full shadow-inner">
                              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                              <button type="button" disabled={isUploading} onClick={() => fileInputRef.current.click()} className="p-2.5 hover:bg-brand-secondary/50 rounded-full transition text-brand-accent relative shrink-0">
                                 {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-brand-accent" /> : <Paperclip className="w-5 h-5" />}
                              </button>
 
                              <input 
                                 type="text" 
                                 value={chatInput} 
                                 onChange={(e) => setChatInput(e.target.value)}
                                 onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(chatInput); }}
                                 className="flex-grow bg-transparent border-none focus:ring-0 px-3 py-1.5 text-sm sm:text-base text-brand-text placeholder-brand-text/40 font-medium" 
                                 placeholder="Type a message..." 
                              />
                              <button 
                                 onClick={() => sendChatMessage(chatInput)} 
                                 disabled={isSendingMessage}
                                 className="text-brand-accent hover:text-brand-primary p-2.5 hover:scale-105 active:scale-95 transition shrink-0 disabled:opacity-50"
                              >
                                 {isSendingMessage ? <Loader2 className="w-5 h-5 animate-spin text-brand-accent" /> : <Send className="w-5 h-5 fill-current" />}
                              </button>
                           </div>
                        </div>
                     </>
                  ) : (
                     <div className="flex flex-col items-center justify-center flex-grow p-8 text-center text-brand-text/40 space-y-4">
                        <MessageSquare className="w-16 h-16 text-brand-text/20" />
                        <span className="text-lg font-bold text-brand-text/60">Select or Start a Conversation</span>
                        <p className="text-sm max-w-md">
                           Need assistance? Create a new support ticket conversation and an administrator will respond shortly.
                        </p>
                        <button 
                           onClick={() => setShowNewTicketModal(true)} 
                           className="bg-brand-primary text-white px-6 py-3 rounded-full font-black shadow-lg hover:bg-brand-primary/80 transition active:scale-95"
                        >
                           Create Support Ticket
                        </button>
                     </div>
                  )}
               </div>
 
               {/* New Ticket Modal */}
               {showNewTicketModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                     <div className="bg-brand-secondary border border-brand-border/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-left">
                        <button 
                           onClick={() => setShowNewTicketModal(false)}
                           className="absolute top-4 right-4 text-brand-text/60 hover:text-brand-text transition"
                        >
                           <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-xl font-black text-brand-text mb-4">Start Support Chat</h3>
                        <div className="space-y-4">
                           <div>
                              <label className="text-xs font-bold text-brand-text/70 uppercase tracking-wider block mb-1">Subject / Question</label>
                              <input 
                                 type="text" 
                                 placeholder="e.g. Deposit issue, Plan upgrade details..." 
                                 value={newTicketSubject}
                                 onChange={(e) => setNewTicketSubject(e.target.value)}
                                 className="w-full bg-brand-dark/60 border border-brand-border/30 rounded-2xl px-4 py-3 text-brand-text placeholder-brand-text/30 focus:outline-none focus:border-brand-primary transition"
                              />
                           </div>
                           <button
                               disabled={isCreatingTicket}
                               onClick={async () => {
                                  if (!newTicketSubject.trim()) {
                                     alert('Please enter a subject.');
                                     return;
                                  }
                                  setIsCreatingTicket(true);
                                  try {
                                     await createUserConversation(newTicketSubject);
                                     setNewTicketSubject('');
                                     setShowNewTicketModal(false);
                                  } catch (e) {
                                     alert('Failed to create ticket.');
                                  } finally {
                                     setIsCreatingTicket(false);
                                  }
                               }}
                               className="w-full bg-brand-primary text-white py-3 rounded-2xl font-black uppercase tracking-wider hover:bg-brand-primary/80 transition active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                               {isCreatingTicket && <Loader2 className="w-4 h-4 animate-spin" />}
                               {isCreatingTicket ? 'Processing...' : 'Create Conversation'}
                            </button>
                        </div>
                     </div>
                  </div>
               )}
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
        <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} balance={parseFloat(user?.balance || 0)} />
        <NotificationCenterModal open={notificationDrawerOpen} onClose={() => setNotificationDrawerOpen(false)} notifications={notifications} onMarkRead={handleMarkRead} />
      </main>
    </div>
  );
};

export default Dashboard;
