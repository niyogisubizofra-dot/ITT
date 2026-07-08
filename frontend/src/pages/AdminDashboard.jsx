import { useState, useEffect, useRef, useMemo } from 'react';
import useAuthStore from '../store/authStore';
import useAdminStore from '../store/adminStore';
import {
  LayoutDashboard, Users, Wallet, TrendingUp, DollarSign, CreditCard,
  Bell, MessageSquare, Zap, LogOut, Home, Menu, X, Search,
  CheckCircle2, XCircle, ArrowRight, ArrowUpRight, ArrowDownRight,
  Send, Image, Loader2, Megaphone, ShieldCheck, Ban, Eye, Trash2,
  RefreshCw, UserPlus, CheckSquare, Clock, Paperclip, Archive, UserCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';


const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Admin store (cached data) ─────────────────────────────────────────────────────────
  const stats = useAdminStore((s) => s.stats);
  const revenueChart = useAdminStore((s) => s.revenueChart);
  const users = useAdminStore((s) => s.users);
  const usersLoading = useAdminStore((s) => s.usersLoading);
  const pendingTx = useAdminStore((s) => s.pendingTx);
  const investments = useAdminStore((s) => s.investments);
  const broadcasts = useAdminStore((s) => s.broadcasts);
  const conversations = useAdminStore((s) => s.conversations);
  const chatHistories = useAdminStore((s) => s.chatHistories);

  const fetchStats = useAdminStore((s) => s.fetchStats);
  const fetchRevenueChart = useAdminStore((s) => s.fetchRevenueChart);
  const fetchUsers = useAdminStore((s) => s.fetchUsers);
  const fetchPendingTx = useAdminStore((s) => s.fetchPendingTx);
  const fetchInvestments = useAdminStore((s) => s.fetchInvestments);
  const fetchBroadcasts = useAdminStore((s) => s.fetchBroadcasts);
  const fetchConversations = useAdminStore((s) => s.fetchConversations);
  const fetchChatHistory = useAdminStore((s) => s.fetchChatHistory);
  const prependUser = useAdminStore((s) => s.prependUser);
  const patchStats = useAdminStore((s) => s.patchStats);
  const patchUserStatus = useAdminStore((s) => s.patchUserStatus);
  const deleteUser = useAdminStore((s) => s.deleteUser);
  const removePendingTx = useAdminStore((s) => s.removePendingTx);
  const prependBroadcast = useAdminStore((s) => s.prependBroadcast);
  const upsertConversation = useAdminStore((s) => s.upsertConversation);
  const markConversationRead = useAdminStore((s) => s.markConversationRead);
  const appendAdminChatMessage = useAdminStore((s) => s.appendAdminChatMessage);
  const invalidateStats = useAdminStore((s) => s.invalidateStats);

  // ── Pie chart (static) ──────────────────────────────────────────────────────────────────────
  const [pieData] = useState([
    { name: 'Clients', value: 55 },
    { name: 'Staff', value: 30 },
    { name: 'Partners', value: 15 }
  ]);

  // Track newly registered users for a live toast
  const [newUserAlert, setNewUserAlert] = useState(null);

  // Fetch overview data on mount (cached — only runs once unless TTL expires)
  useEffect(() => {
    fetchStats();
    fetchRevenueChart();
  }, []);

  // ── Real-time admin socket — stays alive for the full session ──────────────────
  useEffect(() => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
    const adminSocket = io(socketUrl || undefined, {
      withCredentials: true,
      auth: { token: useAuthStore.getState().accessToken },
    });

    adminSocket.emit('joinAdmin');
    adminSocket.emit('subscribeDashboard');

    adminSocket.on('newUser', (newUser) => {
      // Update the store — visible immediately in Users tab
      prependUser(newUser);
      // Increment totalUsers in cached stats
      patchStats({ totalUsers: (useAdminStore.getState().stats.totalUsers || 0) + 1 });
      // Show live alert toast
      setNewUserAlert(newUser);
      setTimeout(() => setNewUserAlert(null), 6000);
    });

    adminSocket.on('transactionApproved', () => {
      // Force-invalidate stats cache and re-fetch
      invalidateStats();
      fetchStats(true);
    });

    return () => adminSocket.disconnect();
  }, [user]);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  // Ensure activeTab is valid - fallback to overview to avoid blank page
  const knownTabs = ['overview', 'users', 'transactions', 'investments', 'broadcast', 'chat', 'tasks'];
  useEffect(() => {
    if (!knownTabs.includes(activeTab)) {
      setSearchParams({ tab: 'overview' });
      setActiveTab('overview');
    }
  }, [activeTab]);

  // ── Users ─────────────────────────────────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [investmentsPage, setInvestmentsPage] = useState(1);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, statusFilter]);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'tasks') fetchUsers();
  }, [activeTab]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, userSearch, statusFilter]);

  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice((userPage - 1) * 10, userPage * 10);
  }, [filteredUsers, userPage]);

  const paginatedInvestments = useMemo(() => {
    return investments.slice((investmentsPage - 1) * 10, investmentsPage * 10);
  }, [investments, investmentsPage]);

  const toggleUserStatus = async (id) => {
    setSuspendingUserId(id);
    const target = users.find(u => u.id === id);
    const newStatus = target?.status === 'active' ? 'suspended' : 'active';
    try {
      await axios.post(`/api/admin/users/${id}/toggle-status`);
      patchUserStatus(id, newStatus);
    } catch (err) {
      alert('Failed to update user status');
    } finally {
      setSuspendingUserId(null);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    setDeletingUserId(id);
    try {
      await axios.delete(`/api/admin/users/${id}`);
      deleteUser(id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  // ── Transactions ───────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'transactions') fetchPendingTx();
  }, [activeTab]);

  const handleTxDecision = async (id, decision) => {
    setProcessingTxId(id);
    try {
      await axios.post(`/api/admin/transactions/${id}/${decision}`);
      removePendingTx(id);
    } catch (err) {
      alert('Failed to process transaction');
    } finally {
      setProcessingTxId(null);
    }
  };

  // ── Investments ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'investments') fetchInvestments();
  }, [activeTab]);

  // ── Broadcasts ───────────────────────────────────────────────────────────────────────
  const [broadcastText, setBroadcastText] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  useEffect(() => {
    if (activeTab === 'broadcast') fetchBroadcasts();
  }, [activeTab]);

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setIsSendingBroadcast(true);
    const newBroadcast = { id: Date.now(), message: broadcastText, date: new Date().toISOString() };
    try {
      await axios.post('/api/admin/broadcasts', { message: broadcastText });
    } catch (err) {
      // still reflect locally even if the request fails
    } finally {
      prependBroadcast(newBroadcast);
      setBroadcastText('');
      setIsSendingBroadcast(false);
    }
  };

  // ── Create Tasks ───────────────────────────────────────────────────────────────────
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState(null);

  const taskFilteredUsers = useMemo(() => {
    return users.filter(u =>
      u.username.toLowerCase().includes(taskSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(taskSearch.toLowerCase())
    );
  }, [users, taskSearch]);

  const handleToggleSelectAll = () => {
    const visibleIds = taskFilteredUsers.map(u => u.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedUsers.includes(id));

    if (allSelected) {
      setSelectedUsers(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedUsers(prev => {
        const next = [...prev];
        visibleIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return alert('Task title is required');
    if (selectedUsers.length === 0) return alert('Please select at least one assignee');

    setIsCreatingTask(true);
    setTaskSuccess(null);

    try {
      await axios.post('/api/tasks/bulk', {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        dueDate: taskDueDate || null,
        assignedTo: selectedUsers,
      });

      setTaskSuccess({ type: 'success', text: 'Task created successfully and assigned!' });
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setTaskDueDate('');
      setSelectedUsers([]);
      setTimeout(() => setTaskSuccess(null), 5000);
    } catch (err) {
      setTaskSuccess({ type: 'error', text: err.response?.data?.error || 'Failed to create task.' });
    } finally {
      setIsCreatingTask(false);
    }
  };

  // ── Chat (multi-conversation) ──────────────────────────────────────────────────────
  const admins = useAdminStore((s) => s.admins);
  const activeConversation = useAdminStore((s) => s.activeConversation);
  const chatMessages = useAdminStore((s) => s.chatMessages);
  const chatLoading = useAdminStore((s) => s.chatLoading);
  const conversationFilters = useAdminStore((s) => s.conversationFilters);
  
  const setConversationFilters = useAdminStore((s) => s.setConversationFilters);
  const fetchAdmins = useAdminStore((s) => s.fetchAdmins);
  const updateTicketStatus = useAdminStore((s) => s.updateTicketStatus);
  const assignTicket = useAdminStore((s) => s.assignTicket);
  const archiveTicket = useAdminStore((s) => s.archiveTicket);
  const selectConversation = useAdminStore((s) => s.selectConversation);
  const fetchConversationMessages = useAdminStore((s) => s.fetchConversationMessages);
  
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [searchMessageQuery, setSearchMessageQuery] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [processingTxId, setProcessingTxId] = useState(null);
  const [suspendingUserId, setSuspendingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch conversations list & admins when opening chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      fetchConversations(true);
      fetchAdmins();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'chat' && user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

      const newSocket = io(socketUrl || undefined, { withCredentials: true });
      setSocket(newSocket);
      newSocket.emit('joinChat', user.id);

      newSocket.on('receiveChatMessage', (message) => {
        const fromUser = message.senderId === user?.id ? message.receiverId : message.senderId;
        appendAdminChatMessage(fromUser, message);
        upsertConversation(message, user?.id);
      });

      newSocket.on('ticketStatusChanged', ({ id, status }) => {
        fetchConversations(true);
        if (activeConversation && Number(id) === Number(activeConversation.id)) {
          fetchConversationMessages(activeConversation.id);
        }
      });
      newSocket.on('ticketAssigned', ({ id, assignedAdminId, assignedAdminName }) => {
        fetchConversations(true);
        if (activeConversation && Number(id) === Number(activeConversation.id)) {
          fetchConversationMessages(activeConversation.id);
        }
      });
      newSocket.on('ticketArchived', ({ id, isArchived }) => {
        fetchConversations(true);
        if (activeConversation && Number(id) === Number(activeConversation.id)) {
          fetchConversationMessages(activeConversation.id);
        }
      });

      return () => newSocket.disconnect();
    }
  }, [activeTab, user, activeConversation]);

  const sendAdminMessage = async (text = '', imageUrl = null, fileUrl = null, fileName = null) => {
    if ((!text.trim() && !imageUrl && !fileUrl) || !activeConversation || isSendingMessage) return;
    setIsSendingMessage(true);
    try {
      await axios.post('/api/admin/chat/send', {
        receiverId: activeConversation.userId,
        senderId: user?.id,
        conversationId: activeConversation.id,
        text,
        image: imageUrl,
        fileUrl,
        fileName,
      });
      
      appendAdminChatMessage(activeConversation.userId, {
        id: Date.now(),
        senderId: user?.id,
        senderName: 'Support Agent',
        conversationId: activeConversation.id,
        text,
        image: imageUrl,
        fileUrl,
        fileName,
        createdAt: new Date().toISOString(),
      });
      setChatInput('');
    } catch (err) {
      alert('Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleAdminFileUpload = async (e) => {
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
        sendAdminMessage('', res.data.fileUrl);
      } else {
        sendAdminMessage('', null, res.data.fileUrl, res.data.fileName);
      }
    } catch (err) {
      alert('Failed to upload file. Please try again.');
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
    { id: 'tasks', label: 'Create Tasks', icon: CheckSquare },
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
                    {paginatedUsers.map(u => (
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
                              disabled={suspendingUserId === u.id}
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                u.status === 'active' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-600'
                              } disabled:opacity-50`}
                              title={u.status === 'active' ? 'Suspend user' : 'Reactivate user'}
                            >
                              {suspendingUserId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button
                              disabled={deletingUserId === u.id || u.id === user?.id}
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-30"
                              title={u.id === user?.id ? "You cannot delete yourself" : "Delete user"}
                            >
                              {deletingUserId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
                {filteredUsers.length > 10 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">
                      Showing {(userPage - 1) * 10 + 1} to {Math.min(userPage * 10, filteredUsers.length)} of {filteredUsers.length} users
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={userPage === 1}
                        onClick={() => setUserPage(p => Math.max(1, p - 1))}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        disabled={userPage * 10 >= filteredUsers.length}
                        onClick={() => setUserPage(p => p + 1)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
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
                            disabled={processingTxId === t.id}
                            onClick={() => handleTxDecision(t.id, 'approve')}
                            className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                          >
                            {processingTxId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {processingTxId === t.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            disabled={processingTxId === t.id}
                            onClick={() => handleTxDecision(t.id, 'reject')}
                            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all disabled:opacity-50"
                          >
                            {processingTxId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            {processingTxId === t.id ? 'Processing...' : 'Reject'}
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
                    {paginatedInvestments.map(inv => (
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
                {investments.length > 10 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">
                      Showing {(investmentsPage - 1) * 10 + 1} to {Math.min(investmentsPage * 10, investments.length)} of {investments.length} investments
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={investmentsPage === 1}
                        onClick={() => setInvestmentsPage(p => Math.max(1, p - 1))}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        disabled={investmentsPage * 10 >= investments.length}
                        onClick={() => setInvestmentsPage(p => p + 1)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
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
                    {isSendingBroadcast ? 'Processing...' : 'Publish Broadcast'}
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
              {/* Left Panel: Conversation list with search & filters */}
              <div className={`w-full sm:w-80 border-r border-slate-100 flex-col shrink-0 ${activeConversation ? 'hidden sm:flex' : 'flex'}`}>
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0 text-left">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Search conversations..."
                      value={conversationFilters.search}
                      onChange={(e) => setConversationFilters({ search: e.target.value })}
                      className="w-full bg-white border border-slate-250 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Status</label>
                      <select 
                        value={conversationFilters.status}
                        onChange={(e) => setConversationFilters({ status: e.target.value })}
                        className="w-full bg-white border border-slate-250 rounded-xl px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Assigned To</label>
                      <select 
                        value={conversationFilters.assignedAdminId}
                        onChange={(e) => setConversationFilters({ assignedAdminId: e.target.value })}
                        className="w-full bg-white border border-slate-250 rounded-xl px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
                      >
                        <option value="all">Everyone</option>
                        <option value="me">Me</option>
                        <option value="unassigned">Unassigned</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="showArchived" 
                      checked={conversationFilters.isArchived}
                      onChange={(e) => setConversationFilters({ isArchived: e.target.checked })}
                      className="rounded text-brand-primary focus:ring-brand-primary/30 border-slate-300 w-4 h-4"
                    />
                    <label htmlFor="showArchived" className="text-[10px] font-bold text-slate-600 cursor-pointer">Show Archived Chats</label>
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-grow overflow-y-auto">
                  {conversations.map(c => {
                     const isSelected = activeConversation?.id === c.id;
                     return (
                       <button
                         key={c.id}
                         onClick={() => {
                           selectConversation(c);
                         }}
                         className={`w-full flex items-center gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${
                           isSelected ? 'bg-blue-50/60' : ''
                         }`}
                       >
                         <img src={`https://ui-avatars.com/api/?name=${c.username}&background=2563eb&color=fff`} className="w-10 h-10 rounded-full flex-shrink-0" alt={c.username} />
                         <div className="min-w-0 flex-grow">
                           <div className="flex items-center justify-between mb-0.5">
                             <p className="font-bold text-slate-800 text-sm truncate">{c.username}</p>
                             <span className="text-[9px] text-slate-400 font-bold flex-shrink-0">
                               {new Date(c.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                             </span>
                           </div>
                           <p className="text-[11px] font-semibold text-brand-primary truncate">{c.subject}</p>
                           <p className="text-xs text-slate-500 truncate">{c.lastMessage || 'No messages yet'}</p>
                           
                           {/* Status & assignment badges */}
                           <div className="flex items-center space-x-2 mt-2">
                             <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                               c.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                               c.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                               c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                               'bg-slate-100 text-slate-700'
                             }`}>
                               {c.status}
                             </span>
                             <span className="text-[9px] font-medium text-slate-400 truncate">
                               {c.assignedAdminId 
                                 ? c.assignedAdminId === user?.id ? 'Assigned to me' : `Assigned: ${c.assignedAdminName || 'Agent'}`
                                 : 'Unassigned'}
                             </span>
                           </div>
                         </div>
                         {c.unread > 0 && (
                           <span className="w-5 h-5 flex items-center justify-center bg-brand-primary text-white text-[10px] font-black rounded-full flex-shrink-0">{c.unread}</span>
                         )}
                       </button>
                     );
                  })}
                  {conversations.length === 0 && (
                     <div className="p-8 text-center text-slate-400 text-sm font-medium">
                        No conversations found matching filters.
                     </div>
                  )}
                </div>
              </div>

              {/* Chat panel */}
              <div className={`flex-grow flex-col ${activeConversation ? 'flex' : 'hidden sm:flex'}`}>
                {!activeConversation ? (
                  <div className="flex-grow flex items-center justify-center text-slate-400 font-bold bg-slate-50/20">
                    Select a conversation to start chatting
                  </div>
                ) : (
                  <>
                    {/* Header with ticket management options */}
                    <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 shrink-0">
                      <div className="flex items-center gap-3">
                        <button className="sm:hidden text-slate-500" onClick={() => selectConversation(null)}>
                          <X className="w-5 h-5" />
                        </button>
                        <img src={`https://ui-avatars.com/api/?name=${activeConversation.username}&background=2563eb&color=fff`} className="w-9 h-9 rounded-full" alt={activeConversation.username} />
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-slate-800 text-base">{activeConversation.username}</span>
                             <span className="text-xs font-semibold text-slate-400">({activeConversation.userRole || 'User'})</span>
                          </div>
                          <span className="text-xs font-bold text-brand-primary block">{activeConversation.subject}</span>
                        </div>
                      </div>

                      {/* Ticket controls */}
                      <div className="flex flex-wrap items-center gap-3">
                         {/* Search messages query */}
                         <input 
                            type="text" 
                            placeholder="Search messages..."
                            value={searchMessageQuery}
                            onChange={(e) => setSearchMessageQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary w-36"
                         />

                         {/* Assign Admin dropdown */}
                         <div className="flex items-center space-x-1">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <select 
                               value={activeConversation.assignedAdminId || ''}
                               onChange={(e) => assignTicket(activeConversation.id, e.target.value ? parseInt(e.target.value) : null)}
                               className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-700 focus:outline-none"
                            >
                               <option value="">Unassigned</option>
                               {admins.map(adm => (
                                  <option key={adm.id} value={adm.id}>{adm.username} {adm.id === user?.id ? '(me)' : ''}</option>
                               ))}
                            </select>
                         </div>

                         {/* Status switcher */}
                         <select 
                            value={activeConversation.status}
                            onChange={(e) => updateTicketStatus(activeConversation.id, e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-700 focus:outline-none font-bold"
                         >
                            <option value="Open">Open</option>
                            <option value="Pending">Pending</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                         </select>

                         {/* Archive toggle */}
                         <button
                            onClick={() => archiveTicket(activeConversation.id, !activeConversation.isArchived)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition ${
                               activeConversation.isArchived 
                                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-350' 
                                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                            }`}
                         >
                            <Archive className="w-3.5 h-3.5" />
                            {activeConversation.isArchived ? 'Unarchive' : 'Archive'}
                         </button>
                      </div>
                    </div>

                    {/* Chat Messages scroll area */}
                    <div className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-50/50 flex flex-col scrollbar-thin">
                      {chatMessages
                        .filter(m => !searchMessageQuery || m.text?.toLowerCase().includes(searchMessageQuery.toLowerCase()))
                        .map((msg, index) => {
                          const isSelf = msg.senderId === user?.id;
                          return (
                            <div key={msg.id || index} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                              {!isSelf && (
                                <img src={`https://ui-avatars.com/api/?name=${activeConversation.username}&background=2563eb&color=fff`} className="w-7 h-7 rounded-full mb-1 flex-shrink-0 border border-slate-200 shadow-sm" alt="avatar" />
                              )}
                              <div className={`relative px-4 py-2.5 rounded-[18px] text-[15px] leading-tight shadow-sm border max-w-[70%] text-left ${
                                isSelf
                                  ? 'bg-gradient-to-r from-brand-primary to-blue-500 text-white rounded-br-[4px] border-brand-primary/20'
                                  : 'bg-white text-slate-700 border-slate-200 rounded-bl-[4px]'
                              }`}>
                                {msg.text && <p className="font-normal">{msg.text}</p>}
                                {msg.image && (
                                  <a href={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} target="_blank" rel="noopener noreferrer" className="block mt-2 overflow-hidden rounded-xl border border-slate-100 p-1">
                                    <img src={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} alt="attachment" className="w-full max-w-[260px] sm:max-w-md object-cover rounded-lg" />
                                  </a>
                                )}
                                {msg.fileUrl && (
                                   <div className="mt-2 flex items-center space-x-2 bg-slate-50 border border-slate-150 p-2.5 rounded-xl hover:border-brand-primary transition">
                                      <Paperclip className="w-4 h-4 text-brand-primary flex-shrink-0" />
                                      <div className="overflow-hidden flex-grow mr-4">
                                         <span className="text-xs font-bold text-slate-700 block truncate">{msg.fileName || 'Attachment'}</span>
                                      </div>
                                      <a 
                                         href={msg.fileUrl.startsWith('http') ? msg.fileUrl : `/${msg.fileUrl}`} 
                                         download={msg.fileName}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className="text-xs font-black uppercase text-brand-primary hover:underline flex-shrink-0"
                                      >
                                         Download
                                      </a>
                                   </div>
                                )}
                                <span className={`text-[8px] font-semibold block mt-1 uppercase tracking-tighter ${isSelf ? 'text-white/70 text-right' : 'text-slate-400'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      {chatMessages.length === 0 && (
                         <div className="flex-grow flex items-center justify-center text-slate-400 text-sm">
                            No messages in this chat.
                         </div>
                      )}
                    </div>

                    {/* Composer input bar */}
                    <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-full">
                        <input type="file" ref={fileInputRef} onChange={handleAdminFileUpload} className="hidden" />
                        <button type="button" disabled={isUploading} onClick={() => fileInputRef.current.click()} className="p-2.5 hover:bg-slate-200 rounded-full transition text-brand-primary shrink-0">
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                        </button>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendAdminMessage(chatInput); }}
                          className="flex-grow bg-transparent border-none focus:ring-0 px-3 py-1.5 text-sm sm:text-base text-slate-700 placeholder-slate-400 font-medium"
                          placeholder="Reply to user..."
                        />
                        <button 
                            onClick={() => sendAdminMessage(chatInput)} 
                            disabled={isSendingMessage}
                            className="text-brand-primary hover:text-blue-600 p-2.5 hover:scale-105 active:scale-95 transition shrink-0 disabled:opacity-50"
                         >
                           {isSendingMessage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 fill-current" />}
                         </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* CREATE TASKS TAB */}
          {activeTab === 'tasks' && (
            <div className="fade-in max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">Create & Assign Tasks</h2>
                  <p className="text-slate-500 font-medium mt-1">Assign custom checklist items to your users in bulk.</p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <CheckSquare className="w-7 h-7" />
                </div>
              </div>

              {taskSuccess && (
                <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 animate-fade-in ${
                  taskSuccess.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {taskSuccess.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                  <span>{taskSuccess.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form controls (3 cols) */}
                <form onSubmit={handleCreateTask} className="lg:col-span-3 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Task Title *</label>
                    <input
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Complete account tier verification"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Description</label>
                    <textarea
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Specify task requirements or details..."
                      rows={4}
                      className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-medium text-slate-700 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-slate-600 bg-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 font-semibold text-slate-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isCreatingTask}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-primary to-blue-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-brand-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                    >
                      {isCreatingTask ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckSquare className="w-5 h-5" />}
                      {isCreatingTask ? 'Processing...' : `Create and Assign Task (${selectedUsers.length} selected)`}
                    </button>
                  </div>
                </form>

                {/* Assignees panel (2 cols) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[520px]">
                  <div className="pb-4 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Assign To ({selectedUsers.length})</label>
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-xs font-black text-brand-primary hover:underline uppercase tracking-wider"
                      >
                        {taskFilteredUsers.length > 0 && taskFilteredUsers.every(u => selectedUsers.includes(u.id)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        placeholder="Filter users..."
                        className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30 w-full"
                      />
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto py-4 space-y-2 pr-1 scrollbar-thin">
                    {taskFilteredUsers.map(u => {
                      const isSelected = selectedUsers.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/50 border-brand-primary/30 shadow-sm'
                              : 'border-slate-100 hover:bg-slate-50/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedUsers(prev =>
                                isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id]
                              );
                            }}
                            className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary/30 border-slate-300"
                          />
                          <img
                            src={`https://ui-avatars.com/api/?name=${u.username}&background=2563eb&color=fff`}
                            className="w-8 h-8 rounded-full border border-slate-200"
                            alt={u.username}
                          />
                          <div className="min-w-0 flex-grow">
                            <p className="font-bold text-slate-800 text-xs truncate">{u.username}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{u.email}</p>
                          </div>
                        </label>
                      );
                    })}

                    {taskFilteredUsers.length === 0 && (
                      <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                        No active users found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;