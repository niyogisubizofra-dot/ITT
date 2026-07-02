import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

axios.defaults.withCredentials = true;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      activeInvestments: [],
      loading: true,
      
      checkUser: async () => {
        const currentUser = get().user;
        if (currentUser) {
          set({ loading: false });
        } else {
          set({ loading: true });
        }
        try {
          const res = await axios.get('/api/auth/user');
          set({ user: res.data, loading: false });
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
            set({ user: null, loading: false });
          } else {
            set({ loading: false });
          }
        }
      },

      login: async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        set({ user: res.data.user });
        return res;
      },

      register: async (username, email, password, ref) => {
        const res = await axios.post('/api/auth/register', { username, email, password, ref });
        set({ user: res.data.user });
        return res;
      },

      updateBalance: (balance) => {
        set((state) => ({ user: { ...state.user, balance } }));
      },

      addInvestment: async (investment) => {
        try {
          const amount = parseFloat(investment.price.replace('$', '') || 0);
          await axios.post('/api/invest', {
            amount: amount,
            productId: investment.name || 'Product'
          });
          
          // Refresh user data from backend to sync balance
          const userRes = await axios.get('/api/auth/user');
          set({ user: userRes.data });
        } catch (err) {
          console.error('Backend investment logging failed:', err.message);
          throw err;
        }

        set((state) => ({
          activeInvestments: [
            ...state.activeInvestments,
            {
              ...investment,
              id: Date.now(),
              investedAt: new Date().toISOString(),
              profitAdded: false,
            },
          ],
        }));
      },

      claimProfit: async (investmentId) => {
        let profitAmount = 0;
        let pName = 'Product';
        
        set((state) => {
          const investment = state.activeInvestments.find((inv) => inv.id === investmentId);
          if (investment && !investment.profitAdded) {
            profitAmount = parseFloat(investment.dailyProfit.replace('$', ''));
            pName = investment.name || 'Product';
          }
          return state;
        });

        if (profitAmount <= 0) return;

        try {
          const res = await axios.post('/api/invest/claim', {
            amount: profitAmount,
            productId: pName
          });
          
          set((state) => ({
            user: { ...state.user, balance: res.data.balance },
            activeInvestments: state.activeInvestments.map((inv) =>
              inv.id === investmentId ? { ...inv, profitAdded: true } : inv
            )
          }));
        } catch (err) {
          console.error('Failed to claim profit in database:', err.message);
        }
      },

      removeInvestment: (investmentId) => {
        set((state) => ({
          activeInvestments: state.activeInvestments.filter((inv) => inv.id !== investmentId),
        }));
      },

      logout: async () => {
        try {
          await axios.post('/api/auth/logout');
        } catch (err) {
          console.warn('Backend logout failed:', err.message);
        }
        set({ user: null, activeInvestments: [] });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, activeInvestments: state.activeInvestments }),
    }
  )
);

export default useAuthStore;
