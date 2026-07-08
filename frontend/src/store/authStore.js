import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

axios.defaults.withCredentials = true;

// ── Helper: attach / clear Authorization header globally ─────────────────────
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Skip re-fetching /api/auth/user if the user object was validated < 3 minutes ago
const USER_TTL_MS = 3 * 60 * 1000;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      activeInvestments: [],
      loading: true,
      // Track when we last confirmed the user from the server
      userVerifiedAt: null,

      checkUser: async () => {
        const { accessToken, user, userVerifiedAt } = get();

        // Restore auth header from persisted token on every page load
        if (accessToken) {
          setAuthHeader(accessToken);
        }

        // ── Fast path: skip the /api/auth/user network call if the cached user
        // object is fresh enough. This eliminates a round-trip on every page load
        // for users who just logged in or refreshed recently.
        const isUserFresh =
          user &&
          accessToken &&
          userVerifiedAt &&
          Date.now() - userVerifiedAt < USER_TTL_MS;

        if (isUserFresh) {
          set({ loading: false });
          return;
        }

        if (!accessToken) {
          set({ loading: false });
          return;
        }

        set({ loading: true });

        try {
          const res = await axios.get('/api/auth/user');
          set({ user: res.data, loading: false, userVerifiedAt: Date.now() });
        } catch (err) {
          if (
            err.response?.status === 401 ||
            err.response?.status === 403 ||
            err.response?.status === 404
          ) {
            // Token invalid/expired — try to refresh
            const { refreshToken, _refresh } = get();
            if (refreshToken) {
              const refreshed = await _refresh();
              if (!refreshed) {
                setAuthHeader(null);
                set({ user: null, accessToken: null, refreshToken: null, loading: false, userVerifiedAt: null });
              }
            } else {
              setAuthHeader(null);
              set({ user: null, accessToken: null, refreshToken: null, loading: false, userVerifiedAt: null });
            }
          } else {
            set({ loading: false });
          }
        }
      },

      // Internal refresh action
      _refresh: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) return false;
          const res = await axios.post('/api/auth/refresh-token', { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
          setAuthHeader(newAccess);
          set({ accessToken: newAccess, refreshToken: newRefresh });
          // Re-fetch user
          const userRes = await axios.get('/api/auth/user');
          set({ user: userRes.data, loading: false, userVerifiedAt: Date.now() });
          return true;
        } catch {
          return false;
        }
      },

      login: async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        const { accessToken, refreshToken, user } = res.data;
        setAuthHeader(accessToken);
        set({ user, accessToken, refreshToken, userVerifiedAt: Date.now() });
        return res;
      },

      register: async (username, email, password, ref) => {
        const res = await axios.post('/api/auth/register', { username, email, password, ref });
        const { accessToken, refreshToken, user } = res.data;
        setAuthHeader(accessToken);
        set({ user, accessToken, refreshToken, userVerifiedAt: Date.now() });
        return res;
      },

      updateBalance: (balance) => {
        set((state) => ({ user: { ...state.user, balance } }));
      },

      addInvestment: async (investment) => {
        try {
          const amount = parseFloat(investment.price.replace('$', '') || 0);
          await axios.post('/api/invest', {
            amount,
            productId: investment.name || 'Product',
          });

          // Refresh user data from backend to sync balance
          const userRes = await axios.get('/api/auth/user');
          set({ user: userRes.data, userVerifiedAt: Date.now() });
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
            productId: pName,
          });

          set((state) => ({
            user: { ...state.user, balance: res.data.balance },
            activeInvestments: state.activeInvestments.map((inv) =>
              inv.id === investmentId ? { ...inv, profitAdded: true } : inv
            ),
            userVerifiedAt: Date.now(),
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
          const { refreshToken } = get();
          await axios.post('/api/auth/logout', { refreshToken });
        } catch (err) {
          console.warn('Backend logout failed:', err.message);
        }
        setAuthHeader(null);
        set({ user: null, accessToken: null, refreshToken: null, activeInvestments: [], userVerifiedAt: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        activeInvestments: state.activeInvestments,
        userVerifiedAt: state.userVerifiedAt,
      }),
    }
  )
);

export default useAuthStore;
