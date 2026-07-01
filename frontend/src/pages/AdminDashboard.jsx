import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { mockNotifications, mockTasks, mockUsers } from '../data/mockData';
import { 
  Users, LayoutDashboard, CheckSquare, Bell, User, LogOut, 
  PlusCircle, MessageSquare, Trash2, ShieldAlert, Send, Clock,
  CheckCircle2, AlertCircle, Calendar, BarChart3, Home, Menu, X,
  Bold, Italic, Link2, Image, Loader2
} from 'lucide-react';
import { io } from 'socket.io-client';

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'dashboard');
  }, [searchParams]);
  
  const [users, setUsers] = useState(mockUsers);
  const [tasks, setTasks] = useState(mockTasks);
  const [notifications, setNotifications] = useState(mockNotifications);

  // Chat states & Socket connection
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [socket, setSocket] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/auth/all-users');
        const mappedUsers = res.data.map(u => ({ ...u, status: 'active' }));
        setUsers(mappedUsers);
        if (mappedUsers.length > 0) {
          setSelectedUser(mappedUsers[0]);
        }
      } catch (error) {
        setUsers(mockUsers);
        if (mockUsers.length > 0) {
          setSelectedUser(mockUsers[0]);
        }
      }
    };
    fetchUsers();
  }, []);

  // Load chat messages dynamically from backend database
  useEffect(() => {
    if (activeTab === 'chat' && selectedUser) {
      axios.get(`/api/chat/history/${selectedUser.id}`)
        .then(res => {
          setChatMessages((prev) => ({
            ...prev,
            [selectedUser.id]: res.data || []
          }));
        })
        .catch(() => {});
    }
  }, [activeTab, selectedUser]);

  useEffect(() => {
    if (activeTab === 'chat') {
      const socketUrl = window.location.origin === 'http://localhost:5173' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      const newSocket = io(socketUrl, { withCredentials: true });
      setSocket(newSocket);

      // Admin joins chat room 1 to receive messages sent to admin
      newSocket.emit('joinChat', 1);

      newSocket.on('receiveChatMessage', (message) => {
        const chatPartnerId = message.senderId === 1 ? message.receiverId : message.senderId;
        setChatMessages((prev) => {
          const prevMsgs = prev[chatPartnerId] || [];
          // Prevent duplicates
          if (prevMsgs.some(m => m.id === message.id)) return prev;
          return {
            ...prev,
            [chatPartnerId]: [...prevMsgs, message]
          };
        });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [activeTab]);

  const sendChatMessage = async (text = '', imageUrl = null) => {
    if (!selectedUser || (!text.trim() && !imageUrl)) return;

    try {
      await axios.post('/api/chat/send', {
        receiverId: selectedUser.id,
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

  const stats = [
    { label: 'Employee', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'All Tasks', value: tasks.length, icon: CheckSquare, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Overdue', value: 3, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'No Deadline', value: 0, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Due Today', value: 0, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Notifications', value: notifications.length, icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Pending', value: 1, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50' },
    { label: 'In progress', value: 1, icon: Calendar, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'Completed', value: 1, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  const handleAction = (type) => {
    alert(`Action ${type} triggered`);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans fixed inset-0 z-50">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 shadow-2xl md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-center border-b border-slate-800 relative">
          <button 
            className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-brand-primary overflow-hidden shadow-inner">
             <img src="https://ui-avatars.com/api/?name=ishimwe&background=2563eb&color=fff" className="w-full h-full object-cover" alt="Admin" />
          </div>
          <h2 className="text-xl font-bold">Admin</h2>
          <p className="text-slate-400 text-sm">Administrator</p>
        </div>
        
        <nav className="flex-grow py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <Link
            to="/"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all mb-4 border border-slate-800"
          >
            <Home className="w-5 h-5" />
            <span className="font-bold">Back to Home</span>
          </Link>
          
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'create-task', label: 'Create Task', icon: PlusCircle },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'profile', label: 'Profile', icon: User },
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
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto bg-slate-50 w-full">
        {/* Header */}
        <header className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-slate-100">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-3 p-2 text-slate-500 hover:text-brand-primary rounded-lg hover:bg-slate-50"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
              <span className="text-brand-primary mr-1 md:mr-2">Task</span><span className="hidden sm:inline">Management</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="relative group">
              <div className="p-2 hover:bg-slate-100 rounded-full transition cursor-pointer">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 group-hover:text-brand-primary transition" />
              </div>
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">3</span>
            </div>
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-2 sm:pl-4 ml-2 sm:ml-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-none">ishimwe</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Super Admin</p>
              </div>
              <img src="https://ui-avatars.com/api/?name=ishimwe&background=2563eb&color=fff" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-100 shadow-sm" alt="Admin" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          {activeTab === 'dashboard' && (
            <div className="fade-in space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start space-y-2 sm:space-y-0">
                 <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                 <div className="text-sm text-slate-400 font-medium">Overview & Stats</div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                {stats.map((s, i) => (
                  <div key={i} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition duration-300 group cursor-default">
                    <div className={`${s.bg} p-3 sm:p-4 rounded-2xl mb-3 sm:mb-4 group-hover:rotate-12 transition duration-300`}>
                      <s.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${s.color}`} />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-800 mb-1">{s.value}</div>
                    <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-6">
                <div className="lg:col-span-2 bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center">
                      <Send className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-brand-primary" /> Global News Broadcast
                    </h3>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-100">
                    <textarea 
                      className="w-full bg-transparent text-slate-700 placeholder-slate-400 focus:outline-none min-h-[120px] sm:min-h-[180px] text-base sm:text-lg leading-relaxed resize-y"
                      placeholder="Type a message to all users dashboard..."
                    ></textarea>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
                      <p className="text-xs sm:text-sm text-slate-400 flex items-center mb-4 sm:mb-0">
                        <Users className="w-4 h-4 mr-2" /> Will reach 17 employees
                      </p>
                      <button className="w-full sm:w-auto btn-primary px-6 sm:px-8 py-3 flex items-center justify-center font-bold shadow-lg shadow-brand-primary/20">
                        <Send className="w-4 h-4 mr-2" /> Send Update
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 sm:mb-8 flex items-center">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-brand-primary" /> Live Activity
                  </h3>
                  <div className="space-y-4 sm:space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {notifications.map(n => (
                      <div key={n.id} className="relative pl-10 group">
                        <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-white border-2 border-brand-primary group-hover:scale-150 transition z-10"></div>
                        <div className="p-3 sm:p-4 bg-slate-50 hover:bg-white hover:shadow-md rounded-xl transition border border-transparent hover:border-slate-100">
                          <p className="text-slate-800 font-bold text-sm leading-tight">{n.msg}</p>
                          <p className="text-slate-400 text-xs mt-1 flex items-center uppercase font-bold tracking-tighter">
                            <Clock className="w-3 h-3 mr-1" /> {n.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="fade-in bg-white p-4 sm:p-10 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800">User Management</h2>
                  <p className="text-slate-400 text-sm sm:text-base font-medium mt-1">Suspend or delete users and monitor their status.</p>
                </div>
                <div className="flex w-full sm:w-auto space-x-3">
                   <button className="flex-1 sm:flex-none justify-center bg-slate-100 text-slate-700 px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-bold hover:bg-slate-200 transition">Export CSV</button>
                   <button className="flex-1 sm:flex-none justify-center btn-primary px-4 sm:px-6 py-2 rounded-xl text-sm sm:text-base font-bold shadow-md shadow-brand-primary/20">+ Add User</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-50">
                      <th className="pb-6 font-black text-slate-400 uppercase tracking-widest text-xs">Employee</th>
                      <th className="pb-6 font-black text-slate-400 uppercase tracking-widest text-xs">Contact Information</th>
                      <th className="pb-6 font-black text-slate-400 uppercase tracking-widest text-xs">Status</th>
                      <th className="pb-6 font-black text-slate-400 uppercase tracking-widest text-xs text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className="group hover:bg-slate-50/50 transition">
                        <td className="py-6">
                           <div className="flex items-center space-x-3">
                              <img src={`https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff`} className="w-10 h-10 rounded-full shadow-sm" alt={u.username} />
                              <span className="font-bold text-slate-800 text-lg">{u.username}</span>
                           </div>
                        </td>
                        <td className="py-6 text-slate-500 font-medium">{u.email}</td>
                        <td className="py-6">
                          <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                            u.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-4 sm:py-6 text-right space-x-2 sm:space-x-3 whitespace-nowrap">
                          <button className="px-3 sm:px-4 py-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition font-bold text-[10px] sm:text-sm inline-flex items-center">
                            <ShieldAlert className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Suspend</span>
                          </button>
                          <button className="px-3 sm:px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition font-bold text-[10px] sm:text-sm inline-flex items-center">
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'create-task' && (
            <div className="fade-in max-w-3xl mx-auto">
               <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Create New Task</h2>
                  <p className="text-slate-400 mb-6 sm:mb-10 text-sm sm:text-base font-medium">Assign specific goals and deadlines to your team members.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Task Title</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 focus:ring-2 focus:ring-brand-primary/20 outline-none transition" placeholder="e.g. System Audit" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Assign To</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 focus:ring-2 focus:ring-brand-primary/20 outline-none transition appearance-none">
                        {users.map(u => <option key={u.id}>{u.username}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Priority Level</label>
                      <div className="flex space-x-3">
                         {['Low', 'Medium', 'High'].map(p => (
                            <button key={p} className={`flex-grow py-3 rounded-xl border-2 font-bold transition ${p === 'High' ? 'border-brand-primary text-brand-primary bg-blue-50' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>{p}</button>
                         ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Deadline Date</label>
                      <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 focus:ring-2 focus:ring-brand-primary/20 outline-none transition" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-10">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Task Details</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 focus:ring-2 focus:ring-brand-primary/20 outline-none transition min-h-[150px]" placeholder="Explain the task requirements..."></textarea>
                  </div>
                  
                  <button className="w-full btn-primary py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-black shadow-2xl shadow-brand-primary/30 flex items-center justify-center hover:scale-[1.02] active:scale-100 transition">
                    <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-3" /> Assign Task
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="fade-in h-[calc(100vh-140px)] md:h-[750px] flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col bg-slate-50/50 h-[35%] md:h-full">
                <div className="p-4 md:p-6 border-b border-slate-100 sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 hidden sm:block">
                   <h3 className="text-lg sm:text-xl font-black text-slate-800">Messages</h3>
                   <p className="text-slate-400 text-xs sm:text-sm mt-1">{users.length} Users Listed</p>
                </div>
                <div className="flex-grow overflow-y-auto flex md:flex-col">
                  {users.map(u => {
                    const isSelected = selectedUser && selectedUser.id === u.id;
                    const hasMsgs = chatMessages[u.id] && chatMessages[u.id].length > 0;
                    return (
                      <div 
                        key={u.id} 
                        onClick={() => setSelectedUser(u)}
                        className={`p-4 sm:p-6 hover:bg-white cursor-pointer transition md:border-l-4 md:border-b-0 border-b-4 ${isSelected ? 'md:border-brand-primary border-brand-primary bg-white min-w-[150px] md:min-w-0 font-bold' : 'border-transparent opacity-60 min-w-[150px] md:min-w-0'}`}
                      >
                        <div className="flex items-center space-x-3">
                           <div className="relative">
                              <img src={`https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-sm" alt={u.username} />
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 sm:border-4 border-white"></div>
                           </div>
                           <div className="min-w-0 flex-grow">
                              <div className="font-bold text-slate-800 text-sm sm:text-base truncate max-w-[80px] sm:max-w-none">{u.username}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[80px] sm:max-w-[120px]">
                                 {hasMsgs ? `${chatMessages[u.id].length} messages` : u.role}
                              </div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex-grow flex flex-col h-[65%] md:h-full">
                {selectedUser ? (
                  <>
                    <div className="px-4 sm:px-8 py-4 sm:py-6 bg-white border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                         <div className="relative">
                            <img src={`https://ui-avatars.com/api/?name=${selectedUser.username}&background=2563eb&color=fff`} className="w-10 h-10 rounded-full" alt={selectedUser.username} />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                         </div>
                         <div>
                            <span className="font-bold text-slate-800 block text-base sm:text-lg leading-tight">{selectedUser.username}</span>
                            <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 block">{selectedUser.role} • Active Now</span>
                         </div>
                      </div>
                      {/* Rich Text Controls */}
                      <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl">
                         <button type="button" title="Bold text" onClick={() => insertRichText('bold')} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition"><Bold className="w-4 h-4" /></button>
                         <button type="button" title="Italic text" onClick={() => insertRichText('italic')} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition"><Italic className="w-4 h-4" /></button>
                         <button type="button" title="Add Link" onClick={() => insertRichText('link')} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition"><Link2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="flex-grow p-4 sm:p-6 space-y-3 bg-slate-50/10 overflow-y-auto flex flex-col font-sans">
                      {chatMessages[selectedUser.id] && chatMessages[selectedUser.id].length > 0 ? (
                        chatMessages[selectedUser.id].map((msg, index) => {
                          const isSelf = msg.senderId === 1;
                          return (
                            <div key={index} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                              {!isSelf && (
                                 <img src={`https://ui-avatars.com/api/?name=${msg.senderName}&background=random&color=fff`} className="w-7 h-7 rounded-full mb-1 flex-shrink-0 shadow-sm" alt="avatar" />
                              )}
                              <div className={`relative px-4 py-2 sm:py-2.5 rounded-[18px] text-[15px] leading-tight font-sans shadow-sm ${
                                 isSelf 
                                 ? 'bg-[#0084FF] text-white rounded-br-[4px]' 
                                 : 'bg-[#E4E6EB] text-[#050505] rounded-bl-[4px]'
                              } max-w-[70%]`}>
                                 {msg.text && <p className="font-normal">{isSelf ? renderMessageText(msg.text) : msg.text}</p>}
                                 {msg.image && (
                                    <div className="mt-1">
                                       <a href={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} target="_blank" rel="noopener noreferrer">
                                          <img src={msg.image.startsWith('http') ? msg.image : `/${msg.image}`} alt="Uploaded attachment" className="max-w-[200px] sm:max-w-xs rounded-[14px] shadow-sm hover:scale-[1.01] transition" />
                                       </a>
                                    </div>
                                 )}
                                 <span className={`text-[8px] font-semibold block mt-1 uppercase tracking-tighter ${isSelf ? 'text-white/70 text-right' : 'text-slate-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex justify-center items-center h-full text-slate-400 font-medium">
                           No messages exchanged yet. Send a greeting to start.
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-white border-t border-slate-100">
                      <div className="flex items-center space-x-2 bg-[#F0F2F5] p-1.5 rounded-full shadow-inner">
                         <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                         <button type="button" disabled={isUploading} onClick={() => fileInputRef.current.click()} className="p-2.5 hover:bg-slate-200/60 rounded-full transition text-[#0084FF] relative shrink-0">
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-[#0084FF]" /> : <Image className="w-5 h-5" />}
                         </button>

                         <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(chatInput); }}
                            className="flex-grow bg-transparent border-none focus:ring-0 px-3 py-1.5 text-sm sm:text-base text-slate-800 placeholder-slate-400 font-medium w-0 min-w-0" 
                            placeholder="Aa" 
                         />
                         <button onClick={() => sendChatMessage(chatInput)} className="text-[#0084FF] p-2.5 hover:scale-105 active:scale-95 transition shrink-0">
                            <Send className="w-5 h-5 fill-current" />
                         </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center items-center h-full text-slate-400">
                     Select a user from the sidebar to start chatting.
                  </div>
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
