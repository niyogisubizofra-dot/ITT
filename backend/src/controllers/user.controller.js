const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { search, role, status } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'twoFactorSecret', 'resetPasswordToken'] },
      limit, offset,
      order: [['createdAt', 'DESC']],
    });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'twoFactorSecret', 'resetPasswordToken'] },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...rest } = req.body;
    if (password) rest.password = await bcrypt.hash(password, 12);
    await user.update(rest);
    res.json({ msg: 'User updated' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'User deleted' });
  } catch (err) { next(err); }
};

exports.updateBalance = async (req, res, next) => {
  try {
    const { balance } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ balance });
    res.json({ msg: 'Balance updated', balance });
  } catch (err) { next(err); }
};

exports.getProfileSummary = async (req, res, next) => {
  try {
    console.log('[DEBUG] getProfileSummary called:', {
      userId: req.user?.id,
      userRole: req.user?.role,
      paramsId: req.params?.id
    });
    const { Employee, Department, Investment, Transaction, ActivityLog } = require('../models');
    
    // Determine the target user ID
    let targetUserId = req.user.id;
    if (req.params.id) {
      targetUserId = parseInt(req.params.id, 10);
    }

    // Role-based authorization check: users can only view their own summary unless they are Admin
    if (req.user.role !== 'Admin' && targetUserId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }

    // 1. Fetch detailed User info
    const user = await User.findByPk(targetUserId, {
      attributes: { exclude: ['password', 'twoFactorSecret', 'resetPasswordToken', 'resetPasswordExpires'] },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch employee details if applicable
    const employee = await Employee.findOne({
      where: { userId: targetUserId },
      include: [{ model: Department, attributes: ['name'] }]
    });

    const profile = {
      fullName: employee ? `${employee.firstName} ${employee.lastName}` : null,
      username: user.username,
      email: user.email,
      phone: employee ? employee.phone : user.phone || null,
      role: user.role,
      department: employee && employee.Department ? employee.Department.name : null,
      status: user.status,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    // 2. Investment Summary
    const investments = await Investment.findAll({
      where: { userId: targetUserId },
      order: [['createdAt', 'DESC']],
    });

    const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const activeInvestments = investments.filter(inv => inv.status === 'active');
    const activeCount = activeInvestments.length;
    
    // Expected returns: 30-day projection of active investments
    const expectedReturns = activeInvestments.reduce((sum, inv) => sum + (parseFloat(inv.dailyProfit) * 30), 0);
    const totalEarnings = investments.reduce((sum, inv) => sum + parseFloat(inv.totalProfit), 0);
    const currentStatus = activeCount > 0 ? 'Active' : 'Inactive';

    const recentInvestments = investments.slice(0, 5).map(inv => ({
      plan: inv.plan,
      amount: parseFloat(inv.amount),
      dailyProfit: parseFloat(inv.dailyProfit),
      totalProfit: parseFloat(inv.totalProfit),
      status: inv.status,
      startDate: inv.startDate,
      endDate: inv.endDate,
    }));

    // 3. Referral Summary
    // Multi-level referrals: Level 1, 2, 3
    const level1Users = await User.findAll({ where: { referredBy: targetUserId } });
    const level1Ids = level1Users.map(u => u.id);

    const level2Users = level1Ids.length
      ? await User.findAll({ where: { referredBy: { [Op.in]: level1Ids } } })
      : [];
    const level2Ids = level2Users.map(u => u.id);

    const level3Users = level2Ids.length
      ? await User.findAll({ where: { referredBy: { [Op.in]: level2Ids } } })
      : [];
    const level3Ids = level3Users.map(u => u.id);

    const allReferredIds = [...level1Ids, ...level2Ids, ...level3Ids];

    // Fetch active status of referrals (active if they have at least one active investment)
    const activeReferralsWithInvestments = allReferredIds.length ? await Investment.findAll({
      where: {
        userId: { [Op.in]: allReferredIds },
        status: 'active'
      },
      attributes: ['userId'],
      group: ['userId']
    }) : [];
    const activeRefIds = new Set(activeReferralsWithInvestments.map(inv => inv.userId));

    let activeReferralsCount = 0;
    let pendingReferralsCount = 0;
    const referralList = [];

    // All referral transactions for target user to calculate commissions
    const userReferralTransactions = await Transaction.findAll({
      where: {
        userId: targetUserId,
        type: { [Op.in]: ['referral_bonus', 'commission'] }
      }
    });

    const totalReferralCommissions = userReferralTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const allReferredUsers = [
      ...level1Users.map(u => ({ user: u, level: 1 })),
      ...level2Users.map(u => ({ user: u, level: 2 })),
      ...level3Users.map(u => ({ user: u, level: 3 }))
    ];

    for (const item of allReferredUsers) {
      const u = item.user;
      const level = item.level;
      
      const hasActive = activeRefIds.has(u.id);
      if (hasActive) {
        activeReferralsCount++;
      } else {
        pendingReferralsCount++;
      }

      // Calculate total amount invested by this specific referral
      const refInvestments = await Investment.findAll({
        where: { userId: u.id }
      });
      const refTotalInvested = refInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

      // Find commissions earned from this referral
      const refCommissions = userReferralTransactions.filter(t => 
        t.description?.includes(u.id.toString()) || 
        t.description?.includes(u.username)
      );
      const commissionEarned = refCommissions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Try to fetch full name from Employee if exists
      const refEmployee = await Employee.findOne({ where: { userId: u.id } });
      const refName = refEmployee ? `${refEmployee.firstName} ${refEmployee.lastName}` : null;

      referralList.push({
        name: refName,
        username: u.username,
        level,
        registrationDate: u.createdAt,
        status: u.status,
        totalInvested: refTotalInvested,
        commissionEarned
      });
    }

    // 4. Recent Account Activity
    const activityLogs = await ActivityLog.findAll({
      where: { userId: targetUserId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    const financialTransactions = await Transaction.findAll({
      where: { userId: targetUserId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.json({
      profile,
      investments: {
        totalInvested,
        activeCount,
        expectedReturns,
        totalEarnings,
        currentStatus,
        recentInvestments,
      },
      referrals: {
        totalReferrals: allReferredUsers.length,
        activeReferrals: activeReferralsCount,
        pendingReferrals: pendingReferralsCount,
        totalCommissions: totalReferralCommissions,
        referralList,
      },
      activity: {
        logs: activityLogs.map(log => ({
          action: log.action,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
        })),
        transactions: financialTransactions.map(t => ({
          type: t.type,
          amount: parseFloat(t.amount),
          status: t.status,
          reference: t.reference,
          description: t.description,
          createdAt: t.createdAt,
        })),
      }
    });
  } catch (err) {
    next(err);
  }
};
