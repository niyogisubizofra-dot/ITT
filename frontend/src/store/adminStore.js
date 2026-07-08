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

const mockRevenueChart = [
  { name: 'Mon', deposits: 4200, withdrawals: 2100 },
  { name: 'Tue', deposits: 5800, withdrawals: 3000 },
  { name: 'Wed', deposits: 3900, withdrawals: 2600 },
  { name: 'Thu', deposits: 7200, withdrawals: 4100 },
  { name: 'Fri', deposits: 6100, withdrawals: 3300 },
  { name: 'Sat', deposits: 4700, withdrawals: 2000 },
  { name: 'Sun', deposits: 8300, withdrawals: 5200 },
];

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
  revenueChart: mockRevenueChart,
  chartFetchedAt: null,
  chartLoading: false,

  fetchRevenueChart: async (force = false) => {
    if (!force && isFresh(get().chartFetchedAt, TTL.chart)) return;
    if (get().chartLoading) return;
    set({ chartLoading: true });
    try {
      const res = await axios.get('/api/admin/revenue-chart');
      set({
        revenueChart: res.data?.chart?.length ? res.data.chart : mockRevenueChart,
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

  // ── Chat conversations ─────────────────────────────────────────────────────
  conversations: [
    { userId: 1, username: 'j.miller', lastMessage: 'Is my withdrawal processed yet?', unread: 2, time: '10:24 AM' },
    { userId: 2, username: 'sara_k', lastMessage: 'Thanks for the quick help!', unread: 0, time: 'Yesterday' },
    { userId: 5, username: 'chris_trades', lastMessage: 'Can I upgrade my plan?', unread: 1, time: 'Yesterday' },
  ],
  conversationsFetchedAt: null,

  fetchConversations: async (force = false) => {
    // Conversations refresh every 30s or on force
    const CONV_TTL = 30 * 1000;
    if (!force && isFresh(get().conversationsFetchedAt, CONV_TTL)) return;
    try {
      const res = await axios.get('/api/admin/conversations');
      if (res.data?.length) {
        set({ conversations: res.data, conversationsFetchedAt: Date.now() });
      }
    } catch {
      // keep existing list
    }
  },

  upsertConversation: (message, currentUserId) =>
    set((state) => {
      const fromUser =
        message.senderId === currentUserId ? message.receiverId : message.senderId;
      const existing = state.conversations.find((c) => c.userId === fromUser);
      if (existing) {
        return {
          conversations: state.conversations.map((c) =>
            c.userId === fromUser
              ? {
                  ...c,
                  lastMessage: message.text || 'Attachment',
                  unread: (c.unread || 0) + 1,
                  time: 'Now',
                }
              : c
          ),
        };
      }
      const newConv = {
        userId: fromUser,
        username: message.senderName || `User ${fromUser}`,
        lastMessage: message.text || 'Attachment',
        unread: 1,
        time: 'Now',
      };
      return { conversations: [newConv, ...state.conversations] };
    }),

  markConversationRead: (userId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.userId === userId ? { ...c, unread: 0 } : c
      ),
    })),

  // ── Chat messages (keyed per conversation userId) ──────────────────────────
  // Shape: { [userId]: Message[] }
  chatHistories: {},
  chatHistoryLoading: {},

  fetchChatHistory: async (userId, force = false) => {
    const histories = get().chatHistories;
    // Only re-fetch if forced or not yet loaded for this user
    if (!force && histories[userId]) return;
    if (get().chatHistoryLoading[userId]) return;

    set((state) => ({
      chatHistoryLoading: { ...state.chatHistoryLoading, [userId]: true },
    }));
    try {
      const res = await axios.get(`/api/admin/chat/history/${userId}`);
      set((state) => ({
        chatHistories: {
          ...state.chatHistories,
          [userId]: res.data?.length ? res.data : [],
        },
        chatHistoryLoading: { ...state.chatHistoryLoading, [userId]: false },
      }));
    } catch {
      set((state) => ({
        chatHistoryLoading: { ...state.chatHistoryLoading, [userId]: false },
      }));
    }
  },

  appendChatMessage: (userId, message) =>
    set((state) => {
      const prev = state.chatHistories[userId] || [];
      if (prev.some((m) => m.id === message.id)) return state;
      return {
        chatHistories: { ...state.chatHistories, [userId]: [...prev, message] },
      };
    }),

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
