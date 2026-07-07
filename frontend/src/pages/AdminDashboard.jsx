import { useState, useEffect, useRef, useMemo } from 'react';
import useAuthStore from '../store/authStore';
import {
  LayoutDashboard, Users, Wallet, TrendingUp, DollarSign, CreditCard,
  Bell, MessageSquare, Zap, LogOut, Home, Menu, X, Search,
  CheckCircle2, XCircle, ArrowRight, ArrowUpRight, ArrowDownRight,
  Send, Image, Loader2, Megaphone, ShieldCheck, Ban, Eye,
  RefreshCw, UserPlus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

// ---- Fallback mock data (used only if the API call fails or returns nothing) ----
const mockAdminStats = {
  totalUsers: 1284,
  totalDeposits: 182430.55,
  totalWithdrawals: 96210.10,
  platformBalance: 412980.75,
  activeInvestments: 341,
};

const mockRevenueChart = [
  { name: 'Mon', deposits: 4200, withdrawals: 2100 },
  { name: 'Tue', deposits: 5800, withdrawals: 3000 },
  { name: 'Wed', deposits: 3900, withdrawals: 2600 },
  { name: 'Thu', deposits: 7200, withdrawals: 4100 },
  { name: 'Fri', deposits: 6100, withdrawals: 3300 },
  { name: 'Sat', deposits: 4700, withdrawals: 2000 },
  { name: 'Sun', deposits: 8300, withdrawals: 5200 },
];

const mockUsers = [
  { id: 1, username: 'j.miller', email: 'j.miller@mail.com', balance: 4210.50, status: 'active', joined: '2026-02-14', investments: 3 },
  { id: 2, username: 'sara_k', email: 'sara.k@mail.com', balance: 980.00, status: 'active', joined: '2026-03-02', investments: 1 },
  { id: 3, username: 'tundeinvest', email: 'tunde.i@mail.com', balance: 15230.75, status: 'suspended', joined: '2026-01-22', investments: 5 },
  { id: 4, username: 'amara.b', email: 'amara.b@mail.com', balance: 210.20, status: 'active', joined: '2026-04-18', investments: 0 },
  { id: 5, username: 'chris_trades', email: 'chris.trades@mail.com', balance: 6789.00, status: 'active', joined: '2026-05-01', investments: 2 },
];

const mockPendingTransactions = [
  { id: 101, user: 'j.miller', type: 'deposit', amount: 500.00, method: 'Bank Transfer', date: '2026-07-05T14:20:00Z' },
  { id: 102, user: 'sara_k', type: 'withdrawal', amount: 200.00, method: 'Crypto (USDT)', date: '2026-07-05T16:05:00Z' },
  { id: 103, user: 'chris_trades', type: 'withdrawal', amount: 1500.00, method: 'Bank Transfer', date: '2026-07-06T08:40:00Z' },
  { id: 104, user: 'amara.b', type: 'deposit', amount: 50.00, method: 'Card', date: '2026-07-06T09:15:00Z' },
];

const mockInvestments = [
  { id: 201, user: 'j.miller', plan: 'Growth Plan', invested: 1000, dailyProfit: 45, status: 'active' },
  { id: 202, user: 'tundeinvest', plan: 'Premium Plan', invested: 5000, dailyProfit: 260, status: 'active' },
  { id: 203, user: 'chris_trades', plan: 'Starter Plan', invested: 300, dailyProfit: 12, status: 'completed' },
];

const mockBroadcasts = [
  { id: 1, message: 'System maintenance completed successfully. All trading pairs are now live.', date: '2026-07-04T10:00:00Z' },
  { id: 2, message: 'New Premium investment plan is now available with higher daily returns.', date: '2026-06-28T09:30:00Z' },
];

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Overview state
  const [stats, setStats] = useState(mockAdminStats);
  const [revenueChart, setRevenueChart] = useState(mockRevenueChart);
  const [pieData, setPieData] = useState([
    { name: 'Clients', value: 55 },
    { name: 'Staff', value: 30 },
    { name: 'Partners', value: 15 }
  ]);
  // Track newly registered users for a live toast
  const [newUserAlert, setNewUserAlert] = useState(null);

  useEffect(() => {
    axios.get('/api/admin/stats')
      .then(res => setStats(res.data?.stats || mockAdminStats))
      .catch(() => setStats(mockAdminStats));

    axios.get('/api/admin/revenue-chart')
      .then(res => setRevenueChart(res.data?.chart?.length ? res.data.chart : mockRevenueChart))
      .catch(() => setRevenueChart(mockRevenueChart));
  }, []);

  // ── Real-time admin socket — stays alive for the full session ──────────────
  useEffect(() => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
    const adminSocket = io(socketUrl || undefined, {
      withCredentials: true,
      auth: { token: useAuthStore.getState().accessToken },
    });

    adminSocket.emit('joinAdmin'); // Join admin_room for role-gated events
    adminSocket.emit('subscribeDashboard'); // Get dashboard broadcast events

    adminSocket.on('newUser', (newUser) => {
      // Prepend to users list (visible immediately in Users tab)
      setUsers(prev => {
        if (prev.some(u => u.id === newUser.id)) return prev;
        return [newUser, ...prev];
      });
      // Increment totalUsers counter on overview
      setStats(prev => ({ ...prev, totalUsers: (prev.totalUsers || 0) + 1 }));
      // Show live alert toast
      setNewUserAlert(newUser);
      setTimeout(() => setNewUserAlert(null), 6000);
    });

    adminSocket.on('transactionApproved', () => {
      // Refresh stats when a transaction is approved
      axios.get('/api/admin/stats').then(res => setStats(res.data?.stats || {})).catch(() => {});
    });

    return () => adminSocket.disconnect();
  }, [user]);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  // Ensure activeTab is valid - fallback to overview to avoid blank page
  const knownTabs = ['overview', 'users', 'transactions', 'investments', 'broadcast', 'chat'];
  useEffect(() => {
    if (!knownTabs.includes(activeTab)) {
      setSearchParams({ tab: 'overview' });
      setActiveTab('overview');
    }
  }, [activeTab]);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = () => {
    setUsersLoading(true);
    axios.get('/api/admin/users')
      .then(res => {
        // API returns a plain array
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setUsers(list);
      })
      .catch(() => setUsers(mockUsers))
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, userSearch, statusFilter]);

  const toggleUserStatus = (id) => {
    const target = users.find(u => u.id === id);
    const newStatus = target?.status === 'active' ? 'suspended' : 'active';
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    axios.post(`/api/admin/users/${id}/toggle-status`).catch(() => fetchUsers());
  };

  // Transactions state
  const [pendingTx, setPendingTx] = useState(mockPendingTransactions);

  useEffect(() => {
    if (activeTab === 'transactions') {
      axios.get('/api/admin/transactions/pending')
        .then(res => setPendingTx(res.data?.length ? res.data : mockPendingTransactions))
        .catch(() => setPendingTx(mockPendingTransactions));
    }
  }, [activeTab]);

  const handleTxDecision = (id, decision) => {
    setPendingTx(prev => prev.filter(t => t.id !== id));
    axios.post(`/api/admin/transactions/${id}/${decision}`).catch(() => {});
  };

  // Investments state
  const [investments, setInvestments] = useState(mockInvestments);

  useEffect(() => {
    if (activeTab === 'investments') {
      axios.get('/api/admin/investments')
        .then(res => setInvestments(res.data?.length ? res.data : mockInvestments))
        .catch(() => setInvestments(mockInvestments));
    }
  }, [activeTab]);

  // Broadcast state
  const [broadcasts, setBroadcasts] = useState(mockBroadcasts);
  const [broadcastText, setBroadcastText] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  useEffect(() => {
    if (activeTab === 'broadcast') {
      axios.get('/api/admin/broadcasts')
        .then(res => setBroadcasts(res.data?.length ? res.data : mockBroadcasts))
        .catch(() => setBroadcasts(mockBroadcasts));
    }
  }, [activeTab]);

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setIsSendingBroadcast(true);
    const newBroadcast = { id: Date.now(), message: broadcastText, date: new Date().toISOString() };
    try {
      await axios.post('/api/admin/broadcasts', { message: broadcastText });
    } catch (err) {
      // still reflect locally even if the request fails, admin can retry the network call later
    } finally {
      setBroadcasts(prev => [newBroadcast, ...prev]);
      setBroadcastText('');
      setIsSendingBroadcast(false);
    }
  };

  // Support chat state (multi-conversation)
  const [conversations, setConversations] = useState([
    { userId: 1, username: 'j.miller', lastMessage: 'Is my withdrawal processed yet?', unread: 2, time: '10:24 AM' },
    { userId: 2, username: 'sara_k', lastMessage: 'Thanks for the quick help!', unread: 0, time: 'Yesterday' },
    { userId: 5, username: 'chris_trades', lastMessage: 'Can I upgrade my plan?', unread: 1, time: 'Yesterday' },
  ]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [socket, setSocket] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'chat' && activeConversation) {
      axios.get(`/api/admin/chat/history/${activeConversation.userId}`)
        .then(res => setChatMessages(res.data?.length ? res.data : []))
        .catch(() => setChatMessages([]));
    }
  }, [activeTab, activeConversation]);

  // Load conversations list when opening chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      axios.get('/api/admin/conversations')
        .then(res => setConversations(res.data?.length ? res.data : conversations))
        .catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'chat' && user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

      const newSocket = io(socketUrl || undefined, { withCredentials: true });
      setSocket(newSocket);
      newSocket.emit('joinChat', user.id);

      newSocket.on('receiveChatMessage', (message) => {
        setChatMessages((prev) => {
          if (prev.some(m => m.id === message.id)) return prev;
          if (activeConversation && message.senderId !== activeConversation.userId) return prev.concat(message);
          return prev.concat(message);
        });

        // Update conversations list/unread count
        setConversations(prev => {
          const fromUser = message.senderId === user?.id ? message.receiverId : message.senderId;
          const existing = prev.find(c => c.userId === fromUser);
          if (existing) {
            return prev.map(c => c.userId === fromUser ? {
              ...c,
              lastMessage: message.text || 'Attachment',
              unread: activeConversation?.userId === fromUser ? 0 : (c.unread || 0) + 1,
              time: 'Now'
            } : c);
          }
          const newConv = { userId: fromUser, username: message.senderName || `User ${fromUser}`, lastMessage: message.text || 'Attachment', unread: 1, time: 'Now' };
          return [newConv, ...prev];
        });
      });

      return () => newSocket.disconnect();
    }
  }, [activeTab, user, activeConversation]);

  const sendAdminMessage = async (text = '', imageUrl = null) => {
    if ((!text.trim() && !imageUrl) || !activeConversation) return;
    try {
      await axios.post('/api/admin/chat/send', {
        receiverId: activeConversation.userId,
        senderId: user?.id,
        text,
        image: imageUrl
      });
      setChatMessages(prev => [...prev, { senderId: user?.id, senderName: 'Support Agent', text, image: imageUrl, createdAt: new Date().toISOString() }]);
      setChatInput('');
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  const handleAdminFileUpload = async (e) => {
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
      sendAdminMessage('', res.data.path);
    } catch (err) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const overviewCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-100' },
    { label: 'Total Deposits', value: `$${stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: ArrowDownRight, color: 'text-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
    { label: 'Total Withdrawals', value: `$${stats.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50', ring: 'ring-red-100' },
    { label: 'Platform Balance', value: `$${stats.platformBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50', ring: 'ring-amber-100' },
    { label: 'Active Investments', value: stats.activeInvestments.toLocaleString(), icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50', ring: 'ring-violet-100' },
  ];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'transactions', label: 'Deposits & Withdrawals', icon: CreditCard },
    { id: 'investments', label: 'All Investments', icon: Zap },
    { id: 'broadcast', label: 'Broadcast News', icon: Megaphone },
    { id: 'chat', label: 'Support Chat', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/40 overflow-hidden font-sans fixed inset-0 z-50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Live "New User Registered" toast ── */}
      {newUserAlert && (
        <div
          className="fixed top-5 right-5 z-[100] w-80 bg-white rounded-2xl shadow-2xl border border-emerald-100 p-4 flex items-start gap-3 animate-[slideInRight_0.4s_ease]"
          style={{ animation: 'slideInRight 0.4s ease' }}
        >
          <div className="p-2 rounded-xl bg-emerald-50 flex-shrink-0">
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-grow">
            <p className="font-bold text-slate-800 text-sm">New User Registered!</p>
            <p className="text-xs text-slate-600 font-medium truncate">{newUserAlert.username}</p>
            <p className="text-xs text-slate-400 truncate">{newUserAlert.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => setNewUserAlert(null)} className="text-slate-300 hover:text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setSearchParams({ tab: 'users' }); setNewUserAlert(null); }}
              className="text-[10px] font-bold text-emerald-600 hover:underline"
            >
              View →
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col transition-transform duration-300 shadow-2xl md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-center border-b border-white/10 relative">
          <button
            className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-tr from-emerald-400 to-blue-500 p-[2px] shadow-lg shadow-emerald-500/30">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center">
              <ShieldCheck className="w-9 h-9 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold truncate">{user?.username || 'Admin'}</h2>
          <p className="text-slate-400 text-sm tracking-wide">Administrator</p>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
          <Link
            to="/"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all mb-4 border border-white/10"
          >
            <Home className="w-5 h-5" />
            <span className="font-bold">Exit to Home</span>
          </Link>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setSearchParams({ tab: item.id }); setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-400 hover:bg-white/5 hover:text-white hover:pl-5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.id === 'chat' && conversations.some(c => c.unread > 0) && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500"></span>
              )}
              {item.id === 'transactions' && pendingTx.length > 0 && (
                <span className="ml-auto text-[10px] font-black bg-amber-500 text-slate-900 rounded-full px-1.5 py-0.5">{pendingTx.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto w-full">
        <header className="bg-white/80 backdrop-blur-md shadow-sm px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between sticky top-0 z-20 border-b border-slate-200/60 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 p-2 text-slate-500 hover:text-brand-primary rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate max-w-[220px] sm:max-w-none">
              Admin Control Center
            </h1>
          </div>
          <div className="flex items-center self-end sm:self-auto">
            <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All systems operational
            </span>
          </div>
        </header>

        <div className="p-3 sm:p-4 md:p-8 max-w-7xl mx-auto w-full">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="fade-in space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {overviewCards.map((s, i) => (
                  <div key={i} className="bg-white p-3 sm:p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                      <div className={`${s.bg} ring-4 ${s.ring} p-2 sm:p-3 rounded-xl group-hover:scale-110 transition flex-shrink-0`}>
                        <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${s.color}`} />
                      </div>
                    </div>
                    <div className="text-base sm:text-lg md:text-2xl font-black text-slate-800 truncate tracking-tight">{s.value}</div>
                    <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1 line-clamp-2">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
                    <span className="p-2 rounded-xl bg-blue-50 mr-3"><TrendingUp className="w-5 h-5 text-brand-primary" /></span>
                    Deposits vs Withdrawals (7 days)
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="99%" height="100%">
                      <BarChart data={revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }} />
                        <YAxis stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} tick={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'Inter, sans-serif', fontSize: 12 }}
                        />
                        <Bar dataKey="deposits" fill="#10b981" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="withdrawals" fill="#ef4444" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Overview Charts</h3>
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="h-40 bg-slate-50 p-3 rounded-xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie dataKey="value" data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={56} paddingAngle={4}>
                            {pieData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={['#2563eb', '#10b981', '#f97316'][idx % 3]} />
                            ))}
                          </Pie>
                          <Legend verticalAlign="bottom" height={24} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-36 bg-slate-50 p-3 rounded-xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="deposits" stroke="#2563eb" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-8">Awaiting Approval</h3>
                  <div className="space-y-4">
                    {pendingTx.slice(0, 4).map(t => (
                      <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            t.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                          }`}>{t.type}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{new Date(t.date).toLocaleDateString()}</span>
                        </div>
                        <p className="font-bold text-slate-800">{t.user} • ${t.amount.toFixed(2)}</p>
                      </div>
                    ))}
                    <button
                      onClick={() => setSearchParams({ tab: 'transactions' })}
                      className="w-full text-center text-sm font-bold text-brand-primary hover:underline flex items-center justify-center gap-1 pt-2"
                    >
                      Review all requests <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="fade-in bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">Manage Users</h2>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                  <span className="text-sm font-bold text-slate-400">{users.length} users</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search username or email..."
                      className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30 w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <button
                    onClick={fetchUsers}
                    disabled={usersLoading}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    title="Refresh users"
                  >
                    {usersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-3 pr-4">User</th>
                      <th className="pb-3 pr-4">Balance</th>
                      <th className="pb-3 pr-4">Investments</th>
                      <th className="pb-3 pr-4">Joined</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <img src={`https://ui-avatars.com/api/?name=${u.username}&background=2563eb&color=fff`} className="w-9 h-9 rounded-full" alt={u.username} />
                            <div>
                              <p className="font-bold text-slate-800">{u.username}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4 font-black text-slate-800">${u.balance.toFixed(2)}</td>
                        <td className="py-4 pr-4 font-bold text-slate-600">{u.investments}</td>
                        <td className="py-4 pr-4 text-slate-500">{u.joined}</td>
                        <td className="py-4 pr-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            u.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                          }`}>{u.status}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="View details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                u.status === 'active' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-600'
                              }`}
                              title={u.status === 'active' ? 'Suspend user' : 'Reactivate user'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">No users match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="fade-in bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800">Deposits & Withdrawals</h2>
                <button
                  onClick={() => axios.get('/api/admin/transactions/pending').then(res => setPendingTx(res.data?.length ? res.data : mockPendingTransactions)).catch(() => {})}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {pendingTx.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle2 className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-bold">All caught up — no pending requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTx.map(t => (
                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${t.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {t.type === 'deposit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{t.user} <span className="text-slate-400 font-medium">• {t.method}</span></p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(t.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        <span className={`font-black text-lg ${t.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.type === 'deposit' ? '+' : '-'}${t.amount.toFixed(2)}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTxDecision(t.id, 'approve')}
                            className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:-translate-y-0.5 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleTxDecision(t.id, 'reject')}
                            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INVESTMENTS TAB */}
          {activeTab === 'investments' && (
            <div className="fade-in bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-8 flex items-center">
                <span className="p-2.5 rounded-xl bg-violet-50 mr-3"><Zap className="w-7 h-7 text-violet-500" /></span>
                All Active Investments
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-3 pr-4">User</th>
                      <th className="pb-3 pr-4">Plan</th>
                      <th className="pb-3 pr-4">Invested</th>
                      <th className="pb-3 pr-4">Daily Profit</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map(inv => (
                      <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 pr-4 font-bold text-slate-800">{inv.user}</td>
                        <td className="py-4 pr-4 text-slate-600 font-medium">{inv.plan}</td>
                        <td className="py-4 pr-4 font-black text-slate-800">${inv.invested.toFixed(2)}</td>
                        <td className="py-4 pr-4 font-black text-emerald-600">${inv.dailyProfit.toFixed(2)}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            inv.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'
                          }`}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BROADCAST TAB */}
          {activeTab === 'broadcast' && (
            <div className="fade-in max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">Broadcast News</h2>
              <p className="text-slate-500 font-medium mb-6">Send an announcement that every user will see on their dashboard.</p>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <textarea
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={4}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium text-slate-700 resize-none"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={sendBroadcast}
                    disabled={isSendingBroadcast || !broadcastText.trim()}
                    className="flex items-center gap-2 bg-gradient-to-r from-brand-primary to-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-brand-primary/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {isSendingBroadcast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                    Publish Broadcast
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Past Broadcasts</h3>
                {broadcasts.map(b => (
                  <div key={b.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold leading-snug">{b.message}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">{new Date(b.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUPPORT CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="fade-in h-[calc(100vh-140px)] md:h-[650px] bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden flex font-sans">
              {/* Conversation list */}
              <div className={`w-full sm:w-72 border-r border-slate-100 flex-col ${activeConversation ? 'hidden sm:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Conversations</h3>
                </div>
                <div className="flex-grow overflow-y-auto">
                  {conversations.map(c => (
                    <button
                      key={c.userId}
                      onClick={() => {
                        setActiveConversation(c);
                        setConversations(prev => prev.map(x => x.userId === c.userId ? { ...x, unread: 0 } : x));
                      }}
                      className={`w-full flex items-center gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${
                        activeConversation?.userId === c.userId ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <img src={`https://ui-avatars.com/api/?name=${c.username}&background=2563eb&color=fff`} className="w-10 h-10 rounded-full flex-shrink-0" alt={c.username} />
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800 text-sm truncate">{c.username}</p>
                          <span className="text-[10px] text-slate-400 font-bold flex-shrink-0">{c.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{c.lastMessage}</p>
                      </div>
                      {c.unread > 0 && (
                        <span className="w-5 h-5 flex items-center justify-center bg-brand-primary text-white text-[10px] font-black rounded-full flex-shrink-0">{c.unread}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat panel */}
              <div className={`flex-grow flex-col ${activeConversation ? 'flex' : 'hidden sm:flex'}`}>
                {!activeConversation ? (
                  <div className="flex-grow flex items-center justify-center text-slate-400 font-bold">
                    Select a conversation to start chatting
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
                      <button className="sm:hidden text-slate-500" onClick={() => setActiveConversation(null)}>
                        <X className="w-5 h-5" />
                      </button>
                      <img src={`https://ui-avatars.com/api/?name=${activeConversation.username}&background=2563eb&color=fff`} className="w-9 h-9 rounded-full" alt={activeConversation.username} />
                      <span className="font-bold text-slate-800">{activeConversation.username}</span>
                    </div>

                    <div className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-50/50">
                      {chatMessages.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm font-medium">No messages yet in this conversation.</p>
                      ) : chatMessages.map((msg) => {
                        const isSelf = msg.senderId === user?.id;
                        return (
                          <div key={msg.id || msg._id || Math.random()} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                            <div className={`relative px-4 py-2.5 rounded-[18px] text-[15px] leading-tight shadow-sm border max-w-[75%] ${
                              isSelf
                                ? 'bg-gradient-to-r from-brand-primary to-blue-500 text-white rounded-br-[4px] border-brand-primary/20'
                                : 'bg-white text-slate-700 border-slate-200 rounded-bl-[4px]'
                            }`}>
                              {msg.text && <p className="font-normal">{msg.text}</p>}
                              {msg.image && (
                                <a href={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} target="_blank" rel="noopener noreferrer" className="block mt-2 overflow-hidden rounded-xl">
                                  <img src={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} alt="attachment" className="w-full max-w-[260px] object-cover" />
                                </a>
                              )}
                              <span className={`text-[8px] font-semibold block mt-1 uppercase tracking-tighter ${isSelf ? 'text-white/70 text-right' : 'text-slate-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-full">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAdminFileUpload} className="hidden" />
                        <button type="button" disabled={isUploading} onClick={() => fileInputRef.current.click()} className="p-2.5 hover:bg-slate-200 rounded-full transition text-brand-primary shrink-0">
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
                        </button>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendAdminMessage(chatInput); }}
                          className="flex-grow bg-transparent border-none focus:ring-0 px-3 py-1.5 text-sm sm:text-base text-slate-700 placeholder-slate-400 font-medium"
                          placeholder="Reply to user..."
                        />
                        <button onClick={() => sendAdminMessage(chatInput)} className="text-brand-primary hover:text-blue-600 p-2.5 hover:scale-105 active:scale-95 transition shrink-0">
                          <Send className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;