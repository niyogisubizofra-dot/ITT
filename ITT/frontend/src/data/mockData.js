export const mockUser = {
  id: 1,
  username: 'Demo Investor',
  email: 'demo@invest.com',
  balance: 1250.75,
  role: 'user',
};

export const mockAdminUser = {
  id: 2,
  username: 'ishimwe',
  email: 'ishimwe@invest.com',
  balance: 5000,
  role: 'admin',
};

export const mockUsers = [
  { id: 1, username: 'Demo Investor', email: 'demo@invest.com', status: 'active' },
  { id: 2, username: 'Alicia', email: 'alicia@example.com', status: 'active' },
  { id: 3, username: 'Moses', email: 'moses@example.com', status: 'pending' },
];

export const mockTasks = [
  { id: 1, title: 'Share platform update', deadline: 'Today', status: 'In Progress', priority: 'High' },
  { id: 2, title: 'Review referral campaign', deadline: 'Tomorrow', status: 'Pending', priority: 'Medium' },
  { id: 3, title: 'Complete onboarding checklist', deadline: 'Next Week', status: 'Completed', priority: 'Low' },
];

export const mockNotifications = [
  { id: 1, type: 'broadcast', msg: 'New market update is live for all users.', time: '2 min ago' },
  { id: 2, type: 'news', msg: 'Your referral rewards are now available.', time: '15 min ago' },
  { id: 3, type: 'system', msg: 'Daily payout cycle started successfully.', time: '1 hour ago' },
];

export const mockReferralStats = {
  referralCode: 'INVEST-DEMO',
  totalReferrals: 12,
  levels: {
    1: 8,
    2: 3,
    3: 1,
  },
  earnings: {
    registrationBonuses: 3.6,
    total: 24.8,
    level1: 5.6,
    level2: 3.2,
    level3: 1.2,
  },
  transactions: [
    {
      id: 1,
      date: '2026-06-27T10:00:00.000Z',
      type: 'referral_bonus',
      amount: '0.50',
      description: 'Welcome bonus from demo referral',
    },
    {
      id: 2,
      date: '2026-06-25T13:30:00.000Z',
      type: 'investment_commission',
      amount: '4.20',
      description: 'Commission from level 1 investment',
    },
  ],
};

export const mockChartData = [
  { name: 'Mon', value: 120 },
  { name: 'Tue', value: 180 },
  { name: 'Wed', value: 240 },
  { name: 'Thu', value: 220 },
  { name: 'Fri', value: 310 },
  { name: 'Sat', value: 275 },
  { name: 'Sun', value: 340 },
];

export const getMockUserByCredentials = (email = '', password = '') => {
  const normalizedEmail = (email || '').toLowerCase();

  if (normalizedEmail.includes('ishimwe') || normalizedEmail.includes('admin')) {
    return { ...mockAdminUser, email: normalizedEmail || mockAdminUser.email };
  }

  if (normalizedEmail.includes('demo') || password === 'password123') {
    return { ...mockUser, email: normalizedEmail || mockUser.email };
  }

  return { ...mockUser, email: normalizedEmail || mockUser.email };
};

export const createMockUser = ({ username, email }) => ({
  id: Date.now(),
  username,
  email,
  balance: 100,
  role: 'user',
});
