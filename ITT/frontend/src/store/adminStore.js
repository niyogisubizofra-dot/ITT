import { create } from 'zustand';
import axios from 'axios';

// ── Mock fallbacks (same as AdminDashboard had locally) ──────────────────────
const mockAdminStats = {
  totalUsers: 0,
  totalDeposits: 0,
  totalWithdrawals: 0,
  platformBalance: 0,
  activeInvestments: 0,
};

const mockUsers = [];
const mockPendingTransactions = [];
const mockInvestments = [];
const mockBroadcasts = [];

// ── TTL helpers ──────────────────────────────────────────────────────────────
const TTL = {
  stats: 2 * 60 * 1000,       // 2 min — live data
  chart: 5 * 60 * 1000,       // 5 min
  users: 2 * 60 * 1000,       // 2 min
  pendingTx: 1 * 60 * 1000,   // 1 min — most volatile
  investments: 3 * 60 * 1000, // 3 min
  broadcasts: 5 * 60 * 1000,  // 5 min
};

const isFresh = (fetchedAt, ttl) =>
  fetchedAt !== null && Date.now() - fetchedAt < ttl;

// ── Store ────────────────────────────────────────────────────────────────────
const useAdminStore = create((set, get) => ({

  // ── Overview stats ─────────────────────────────────────────────────────────
  stats: mockAdminStats,
  statsFetchedAt: null,
  statsLoading: false,

  fetchStats: async (force = false) => {
    if (!force && isFresh(get().statsFetchedAt, TTL.stats)) return;
    if (get().statsLoading) return;
    set({ statsLoading: true });
    try {
      const res = await axios.get('/api/admin/stats');
      set({
        stats: res.data?.stats || mockAdminStats,
        statsFetchedAt: Date.now(),
        statsLoading: false,
      });
    } catch {
      set({ statsLoading: false });
    }
  },

  // Force-update a specific stat field (e.g. from socket event)
  patchStats: (patch) =>
    set((state) => ({ stats: { ...state.stats, ...patch } })),

  // ── Revenue chart ──────────────────────────────────────────────────────────
  revenueChart: [],
  chartFetchedAt: null,
  chartLoading: false,

  fetchRevenueChart: async (force = false) => {
    if (!force && isFresh(get().chartFetchedAt, TTL.chart)) return;
    if (get().chartLoading) return;
    set({ chartLoading: true });
    try {
      const res = await axios.get('/api/admin/revenue-chart');
      set({
        revenueChart: res.data?.chart?.length ? res.data.chart : [],
        chartFetchedAt: Date.now(),
        chartLoading: false,
      });
    } catch {
      set({ chartLoading: false });
    }
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: mockUsers,
  usersFetchedAt: null,
  usersLoading: false,

  fetchUsers: async (force = false) => {
    if (!force && isFresh(get().usersFetchedAt, TTL.users)) return;
    if (get().usersLoading) return;
    set({ usersLoading: true });
    try {
      const res = await axios.get('/api/admin/users');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      set({ users: list, usersFetchedAt: Date.now(), usersLoading: false });
    } catch {
      set({ usersLoading: false });
    }
  },

  prependUser: (newUser) =>
    set((state) => {
      if (state.users.some((u) => u.id === newUser.id)) return state;
      return { users: [newUser, ...state.users] };
    }),

  patchUserStatus: (id, status) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, status } : u)),
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),

  // ── Pending Transactions ───────────────────────────────────────────────────
  pendingTx: mockPendingTransactions,
  txFetchedAt: null,
  txLoading: false,

  fetchPendingTx: async (force = false) => {
    if (!force && isFresh(get().txFetchedAt, TTL.pendingTx)) return;
    if (get().txLoading) return;
    set({ txLoading: true });
    try {
      const res = await axios.get('/api/admin/transactions/pending');
      set({
        pendingTx: res.data?.length ? res.data : [],
        txFetchedAt: Date.now(),
        txLoading: false,
      });
    } catch {
      set({ txLoading: false });
    }
  },

  removePendingTx: (id) =>
    set((state) => ({ pendingTx: state.pendingTx.filter((t) => t.id !== id) })),

  // ── Investments ────────────────────────────────────────────────────────────
  investments: mockInvestments,
  investFetchedAt: null,
  investLoading: false,

  fetchInvestments: async (force = false) => {
    if (!force && isFresh(get().investFetchedAt, TTL.investments)) return;
    if (get().investLoading) return;
    set({ investLoading: true });
    try {
      const res = await axios.get('/api/admin/investments');
      set({
        investments: res.data?.length ? res.data : [],
        investFetchedAt: Date.now(),
        investLoading: false,
      });
    } catch {
      set({ investLoading: false });
    }
  },

  // ── Broadcasts ─────────────────────────────────────────────────────────────
  broadcasts: mockBroadcasts,
  broadcastFetchedAt: null,
  broadcastLoading: false,

  fetchBroadcasts: async (force = false) => {
    if (!force && isFresh(get().broadcastFetchedAt, TTL.broadcasts)) return;
    if (get().broadcastLoading) return;
    set({ broadcastLoading: true });
    try {
      const res = await axios.get('/api/admin/broadcasts');
      set({
        broadcasts: res.data?.length ? res.data : [],
        broadcastFetchedAt: Date.now(),
        broadcastLoading: false,
      });
    } catch {
      set({ broadcastLoading: false });
    }
  },

  prependBroadcast: (broadcast) =>
    set((state) => ({ broadcasts: [broadcast, ...state.broadcasts] })),

  // ── Chat & Ticket Management ───────────────────────────────────────────────
  conversations: [],
  conversationsFetchedAt: null,
  admins: [],
  activeConversation: null,
  chatMessages: [],
  chatLoading: false,
  conversationFilters: {
    search: '',
    status: 'all',
    assignedAdminId: 'all',
    isArchived: false,
  },

  setConversationFilters: (filters) => {
    set((state) => ({
      conversationFilters: { ...state.conversationFilters, ...filters }
    }));
    get().fetchConversations(true);
  },

  fetchConversations: async (force = false) => {
    const filters = get().conversationFilters;
    try {
      const res = await axios.get('/api/admin/conversations', {
        params: {
          search: filters.search || undefined,
          status: filters.status || undefined,
          assignedAdminId: filters.assignedAdminId === 'all' ? undefined : filters.assignedAdminId,
          isArchived: filters.isArchived,
        }
      });
      set({ conversations: res.data || [], conversationsFetchedAt: Date.now() });
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  },

  fetchAdmins: async () => {
    try {
      const res = await axios.get('/api/admin/admins');
      set({ admins: res.data || [] });
    } catch (err) {
      console.error('Failed to fetch admins list', err);
    }
  },

  updateTicketStatus: async (conversationId, status) => {
    try {
      await axios.patch(`/api/admin/conversations/${conversationId}/status`, { status });
      set((state) => {
        const updated = state.conversations.map((c) =>
          c.id === conversationId ? { ...c, status } : c
        );
        const active = state.activeConversation?.id === conversationId
          ? { ...state.activeConversation, status }
          : state.activeConversation;
        return { conversations: updated, activeConversation: active };
      });
    } catch (err) {
      console.error('Failed to update ticket status', err);
    }
  },

  assignTicket: async (conversationId, assignedAdminId) => {
    try {
      const res = await axios.patch(`/api/admin/conversations/${conversationId}/assign`, { assignedAdminId });
      const { assignedAdminName } = res.data;
      set((state) => {
        const updated = state.conversations.map((c) =>
          c.id === conversationId ? { ...c, assignedAdminId, assignedAdminName } : c
        );
        const active = state.activeConversation?.id === conversationId
          ? { ...state.activeConversation, assignedAdminId, assignedAdminName }
          : state.activeConversation;
        return { conversations: updated, activeConversation: active };
      });
    } catch (err) {
      console.error('Failed to assign ticket', err);
    }
  },

  archiveTicket: async (conversationId, isArchived) => {
    try {
      await axios.patch(`/api/admin/conversations/${conversationId}/archive`, { isArchived });
      set((state) => {
        const activeFilter = state.conversationFilters.isArchived;
        const updated = state.conversations.map((c) =>
          c.id === conversationId ? { ...c, isArchived } : c
        ).filter(c => c.isArchived === activeFilter);

        const active = state.activeConversation?.id === conversationId
          ? { ...state.activeConversation, isArchived }
          : state.activeConversation;
        return { conversations: updated, activeConversation: active };
      });
    } catch (err) {
      console.error('Failed to archive ticket', err);
    }
  },

  selectConversation: (conv) => {
    set({ activeConversation: conv });
    if (conv) {
      get().fetchConversationMessages(conv.id);
      get().markConversationRead(conv.id);
    } else {
      set({ chatMessages: [] });
    }
  },

  fetchConversationMessages: async (conversationId) => {
    set({ chatLoading: true });
    try {
      const res = await axios.get(`/api/admin/conversations/${conversationId}/messages`);
      set({ chatMessages: res.data || [], chatLoading: false });
    } catch {
      set({ chatLoading: false });
    }
  },

  markConversationRead: async (conversationId) => {
    try {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unread: 0 } : c
        )
      }));
    } catch (e) {}
  },

  // ── Legacy Compatibility for Admin Chat ──────────────────────────
  chatHistories: {},
  chatHistoryLoading: {},

  fetchChatHistory: async (userId, force = false) => {
    if (get().chatHistoryLoading[userId]) return;
    set((state) => ({
      chatHistoryLoading: { ...state.chatHistoryLoading, [userId]: true },
    }));
    try {
      const res = await axios.get(`/api/admin/chat/history/${userId}`);
      const messages = res.data || [];
      set((state) => ({
        chatHistories: {
          ...state.chatHistories,
          [userId]: messages,
        },
        chatHistoryLoading: { ...state.chatHistoryLoading, [userId]: false },
      }));
      const active = get().activeConversation;
      if (active && Number(active.userId) === Number(userId)) {
        set({ chatMessages: messages });
      }
    } catch {
      set((state) => ({
        chatHistoryLoading: { ...state.chatHistoryLoading, [userId]: false },
      }));
    }
  },

  appendAdminChatMessage: (userId, message) => {
    set((state) => {
      const prev = state.chatHistories[userId] || [];
      if (prev.some((m) => m.id === message.id)) return state;
      const updatedMessages = [...prev, message];

      const active = state.activeConversation;
      let newChatMessages = state.chatMessages;
      if (active && (Number(active.userId) === Number(userId) || Number(active.id) === Number(message.conversationId))) {
        newChatMessages = state.chatMessages.some(m => m.id === message.id)
          ? state.chatMessages
          : [...state.chatMessages, message];
      }

      return {
        chatHistories: { ...state.chatHistories, [userId]: updatedMessages },
        chatMessages: newChatMessages,
      };
    });
  },

  upsertConversation: (message, currentUserId) =>
    set((state) => {
      const fromUser = message.senderId === currentUserId ? message.receiverId : message.senderId;
      const existing = state.conversations.find((c) => Number(c.userId) === Number(fromUser) || Number(c.id) === Number(message.conversationId));
      
      if (existing) {
        return {
          conversations: state.conversations.map((c) => {
            const isMatch = Number(c.id) === Number(message.conversationId) || (!message.conversationId && Number(c.userId) === Number(fromUser));
            return isMatch
              ? {
                  ...c,
                  lastMessage: message.text || (message.fileUrl ? 'Attachment' : 'Image'),
                  unread: state.activeConversation?.id === c.id ? 0 : (c.unread || 0) + 1,
                  lastMessageAt: message.createdAt || new Date().toISOString(),
                }
              : c;
          }),
        };
      }
      
      get().fetchConversations(true);
      return state;
    }),

  markConversationReadLegacy: (userId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.userId === userId ? { ...c, unread: 0 } : c
      ),
    })),

  // ── Cache invalidation ─────────────────────────────────────────────────────
  invalidateStats: () => set({ statsFetchedAt: null }),
  invalidateUsers: () => set({ usersFetchedAt: null }),
  invalidatePendingTx: () => set({ txFetchedAt: null }),
  invalidateAll: () =>
    set({
      statsFetchedAt: null,
      chartFetchedAt: null,
      usersFetchedAt: null,
      txFetchedAt: null,
      investFetchedAt: null,
      broadcastFetchedAt: null,
    }),
}));

export default useAdminStore;
