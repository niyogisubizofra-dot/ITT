import { create } from 'zustand';
import axios from 'axios';
import { mockChartData, mockReferralStats } from '../data/mockData';

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
  referralData: mockReferralStats,
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
  chartData: mockChartData,
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
        set({ chartData: mockChartData, chartFetchedAt: Date.now(), chartLoading: false });
      }
    } catch {
      set({ chartData: mockChartData, chartFetchedAt: Date.now(), chartLoading: false });
    }
  },

  // ── Chat messages ──────────────────────────────────────────────────────────
  chatMessages: [
    {
      senderId: 'support',
      senderName: 'Support Agent',
      text: 'Welcome to the support desk! How can I help you today?',
      createdAt: new Date().toISOString(),
    },
  ],
  chatLoading: false,

  fetchChatHistory: async () => {
    if (get().chatLoading) return;
    set({ chatLoading: true });
    try {
      const res = await axios.get('/api/chat/history');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        set({ chatMessages: res.data, chatLoading: false });
      } else {
        set({
          chatMessages: [
            {
              senderId: 'support',
              senderName: 'Support Agent',
              text: 'Welcome to the support desk! How can I help you today?',
              createdAt: new Date().toISOString(),
            },
          ],
          chatLoading: false,
        });
      }
    } catch {
      set({ chatLoading: false });
    }
  },

  appendChatMessage: (message) => {
    set((state) => {
      if (state.chatMessages.some((m) => m.id === message.id)) return state;
      return { chatMessages: [...state.chatMessages, message] };
    });
  },

  // ── Cache invalidation ─────────────────────────────────────────────────────
  invalidateReferral: () => set({ referralFetchedAt: null }),
  invalidateChart: () => set({ chartFetchedAt: null }),
  invalidateAll: () =>
    set({ referralFetchedAt: null, chartFetchedAt: null }),
}));

export default useDashboardStore;
