const { Investment, User, Transaction, DailyEarning, sequelize } = require('../models');
const { createNotification } = require('./notification.service');
const { generateReference } = require('../utils/helpers');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const processDailyProfits = async () => {
  logger.info('Running daily profit check...');
  const tx = await sequelize.transaction();
  try {
    const investments = await Investment.findAll({
      where: { status: 'Running' },
      transaction: tx,
    });

    for (const inv of investments) {
      const user = await User.findByPk(inv.userId, { transaction: tx });
      if (!user) continue;

      const lastCheck = inv.lastProfitAt || inv.startDate;
      const elapsedMs = Date.now() - new Date(lastCheck).getTime();
      
      // Calculate how many 24-hour periods have elapsed
      const daysElapsed = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));

      const daysToCredit = Math.min(daysElapsed, inv.remainingDays);
      if (daysToCredit > 0) {
        const profit = parseFloat(inv.dailyProfit) * daysToCredit;
        const newRemaining = inv.remainingDays - daysToCredit;
        const newStatus = newRemaining === 0 ? 'Completed' : 'Running';

        // Update investment
        await inv.update({
          totalProfit: parseFloat(inv.totalProfit) + profit,
          remainingDays: newRemaining,
          status: newStatus,
          lastProfitAt: new Date(),
        }, { transaction: tx });

        // Update user balance
        await user.update({
          balance: parseFloat(user.balance) + profit
        }, { transaction: tx });

        // Create DailyEarning record(s)
        for (let i = 0; i < daysToCredit; i++) {
          await DailyEarning.create({
            userId: user.id,
            investmentId: inv.id,
            amount: inv.dailyProfit,
            date: new Date(new Date(lastCheck).getTime() + (i + 1) * 24 * 60 * 60 * 1000),
          }, { transaction: tx });
        }

        // Log profit transaction
        await Transaction.create({
          userId: user.id,
          type: 'profit',
          amount: profit,
          status: 'completed',
          description: `Daily earnings from ${inv.plan} (${daysToCredit} day(s))`,
          reference: generateReference('PRF'),
        }, { transaction: tx });

        // Notify user
        await createNotification({
          userId: user.id,
          title: 'Daily Earnings Updated',
          message: `Your earnings for ${inv.plan} have been updated. Received +$${profit.toFixed(2)} USDT.`,
          type: 'success',
        });

        if (newStatus === 'Completed') {
          await createNotification({
            userId: user.id,
            title: 'Investment Completed',
            message: `Your investment in ${inv.plan} has run for ${inv.durationDays || 32} days and is now completed. Earnings available for withdrawal.`,
            type: 'success',
          });

          // Notify admins
          try {
            const admins = await User.findAll({ where: { role: 'Admin' }, attributes: ['id'] });
            for (const admin of admins) {
              await createNotification({
                userId: admin.id,
                title: 'User Investment Completed',
                message: `User ${user.username} (${user.email}) finished 32-day investment cycle for ${inv.plan}. Total Profit: $${parseFloat(inv.totalProfit + profit).toFixed(2)}.`,
                type: 'info',
              }).catch(() => {});
            }
          } catch (e) {}
        }
      }
    }

    await tx.commit();
    logger.info('Daily profit check completed.');
  } catch (err) {
    await tx.rollback();
    logger.error('Error processing daily profits:', err);
  }
};

const startProfitScheduler = () => {
  // Check every hour for daily updates
  setInterval(processDailyProfits, 60 * 60 * 1000);
  // Also run immediately on startup
  setTimeout(processDailyProfits, 5000);
};

module.exports = {
  processDailyProfits,
  startProfitScheduler,
};
