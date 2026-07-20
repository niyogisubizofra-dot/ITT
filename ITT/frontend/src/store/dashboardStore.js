import { create } from 'zustand';
import axios from 'axios';
// ── TTL helpers ──────────────────────────────────────────────────────────────
const TTL = {
  referral: 5 * 60 * 1000,  // 5 min
  chart: 5 * 60 * 1000,     // 5 min
};

const isFresh = (fetchedAt, ttl) =>
  fetchedAt !== null && Date.now() - fetchedAt < ttl;

// ── Store ────────────────────────────────────────────────────────────────────
const useDashboardStore = create((set, get) => ({

  // ── Referral data ──────────────────────────────────────────────────────────
  referralData: {
    referralCode: '',
    totalReferrals: 0,
    levels: { 1: 0, 2: 0, 3: 0 },
    earnings: { registrationBonuses: 0, total: 0, level1: 0, level2: 0, level3: 0 },
    transactions: [],
  },
  referralFetchedAt: null,
  referralLoading: false,

  fetchReferralStats: async (force = false) => {
    if (!force && isFresh(get().referralFetchedAt, TTL.referral)) return;
    if (get().referralLoading) return;
    set({ referralLoading: true });
    try {
      const res = await axios.get('/api/referrals/stats');
      set({
        referralData: res.data,
        referralFetchedAt: Date.now(),
        referralLoading: false,
      });
    } catch {
      set({ referralLoading: false });
    }
  },

  // ── Chart data ─────────────────────────────────────────────────────────────
  chartData: [],
  chartFetchedAt: null,
  chartLoading: false,

  fetchChartData: async (balance, force = false) => {
    if (!force && isFresh(get().chartFetchedAt, TTL.chart)) return;
    if (get().chartLoading) return;
    set({ chartLoading: true });
    try {
      const res = await axios.get('/api/referrals/stats');
      const txs = res.data.transactions;
      if (txs && txs.length > 0) {
        const sorted = [...txs].sort((a, b) => {
          const aTime = a.date ? new Date(a.date).getTime() : 0;
          const bTime = b.date ? new Date(b.date).getTime() : 0;
          return aTime - bTime;
        });
        let runningBalance = parseFloat(balance || 0);
        const totalDiff = txs.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        let startBalance = runningBalance - totalDiff;

        const data = sorted.map(t => {
          startBalance += parseFloat(t.amount || 0);
          const dateObj = t.date ? new Date(t.date) : null;
          const name =
            dateObj && !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
              : 'Date';
          return { name, value: parseFloat(startBalance.toFixed(2)) };
        });

        set({ chartData: data, chartFetchedAt: Date.now(), chartLoading: false });
      } else {
        set({ chartData: [{ name: 'Today', value: parseFloat(balance || 0) }], chartFetchedAt: Date.now(), chartLoading: false });
      }
    } catch {
      set({ chartData: [{ name: 'Today', value: parseFloat(balance || 0) }], chartFetchedAt: Date.now(), chartLoading: false });
    }
  },

  // ── Support Chat ──────────────────────────────────────────────────────────
  userConversations: [],
  activeConversationId: null,
  chatMessages: [],
  chatLoading: false,

  fetchUserConversations: async () => {
    try {
      const res = await axios.get('/api/chat/conversations');
      set({ userConversations: res.data || [] });
      
      const activeId = get().activeConversationId;
      if (!activeId && res.data?.length > 0) {
        set({ activeConversationId: res.data[0].id });
      }
    } catch (err) {
      console.error('Failed to fetch user conversations', err);
    }
  },

  createUserConversation: async (subject) => {
    try {
      const res = await axios.post('/api/chat/conversations', { subject });
      set((state) => ({
        userConversations: [res.data, ...state.userConversations],
        activeConversationId: res.data.id,
        chatMessages: [],
      }));
      return res.data;
    } catch (err) {
      console.error('Failed to create support conversation', err);
      throw err;
    }
  },

  fetchChatHistory: async () => {
    let activeId = get().activeConversationId;
    if (!activeId) {
      await get().fetchUserConversations();
      activeId = get().activeConversationId;
    }
    
    if (!activeId) {
      set({
        chatMessages: [
          {
            senderId: 'support',
            senderName: 'Support Agent',
            text: 'Welcome to the support desk! How can I help you today?',
            createdAt: new Date().toISOString(),
          },
        ],
      });
      return;
    }

    if (get().chatLoading) return;
    set({ chatLoading: true });
    try {
      const res = await axios.get(`/api/chat/conversations/${activeId}/messages`);
      set({ chatMessages: res.data || [], chatLoading: false });
    } catch {
      set({ chatLoading: false });
    }
  },

  fetchConversationMessages: async (conversationId) => {
    set({ activeConversationId: conversationId, chatLoading: true });
    try {
      const res = await axios.get(`/api/chat/conversations/${conversationId}/messages`);
      set({ chatMessages: res.data || [], chatLoading: false });
    } catch {
      set({ chatLoading: false });
    }
  },

  markConversationRead: async (conversationId) => {
    try {
      await axios.post(`/api/chat/conversations/${conversationId}/read`);
    } catch (err) {
      console.error('Failed to mark conversation read', err);
    }
  },

  appendChatMessage: (message) => {
    set((state) => {
      const isDuplicate = state.chatMessages.some((m) => m.id === message.id);
      const isForActiveChat = !message.conversationId || Number(state.activeConversationId) === Number(message.conversationId);
      
      const updatedMessages = isDuplicate
        ? state.chatMessages
        : isForActiveChat
          ? [...state.chatMessages, message]
          : state.chatMessages;

      const updatedConvs = state.userConversations.map((c) => {
        if (Number(c.id) === Number(message.conversationId)) {
          return {
            ...c,
            lastMessage: message.text || (message.fileUrl ? 'Attachment' : 'Image'),
            lastMessageAt: message.createdAt,
          };
        }
        return c;
      });

      return {
        chatMessages: updatedMessages,
        userConversations: updatedConvs,
      };
    });
  },

  // ── Cache invalidation ─────────────────────────────────────────────────────
  invalidateReferral: () => set({ referralFetchedAt: null }),
  invalidateChart: () => set({ chartFetchedAt: null }),
  invalidateAll: () =>
    set({ referralFetchedAt: null, chartFetchedAt: null }),
}));

export default useDashboardStore;
