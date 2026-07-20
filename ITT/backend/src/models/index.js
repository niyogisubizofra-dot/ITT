'use strict';
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import all models
const User = require('./user.model')(sequelize);
const Employee = require('./employee.model')(sequelize);
const Department = require('./department.model')(sequelize);
const Project = require('./project.model')(sequelize);
const ProjectTeam = require('./projectTeam.model')(sequelize);
const Client = require('./client.model')(sequelize);
const Event = require('./event.model')(sequelize);
const Task = require('./task.model')(sequelize);
const Revenue = require('./revenue.model')(sequelize);
const Expense = require('./expense.model')(sequelize);
const Budget = require('./budget.model')(sequelize);
const Payroll = require('./payroll.model')(sequelize);
const Attendance = require('./attendance.model')(sequelize);
const LeaveRequest = require('./leaveRequest.model')(sequelize);
const Partnership = require('./partnership.model')(sequelize);
const Document = require('./document.model')(sequelize);
const Notification = require('./notification.model')(sequelize);
const ActivityLog = require('./activityLog.model')(sequelize);
const Announcement = require('./announcement.model')(sequelize);
const Report = require('./report.model')(sequelize);
const Message = require('./message.model')(sequelize);
const Transaction = require('./transaction.model')(sequelize);
const Investment = require('./investment.model')(sequelize);
const RefreshToken = require('./refreshToken.model')(sequelize);
const SupportConversation = require('./supportConversation.model')(sequelize);
const Coin = require('./coin.model')(sequelize);
const TradingWallet = require('./tradingWallet.model')(sequelize);
const UserPortfolio = require('./userPortfolio.model')(sequelize);
const BuyTransaction = require('./buyTransaction.model')(sequelize);
const SellTransaction = require('./sellTransaction.model')(sequelize);
const TradingTransfer = require('./tradingTransfer.model')(sequelize);
const TradingSetting = require('./tradingSetting.model')(sequelize);
const VipPlan = require('./vipPlan.model')(sequelize);
const DailyEarning = require('./dailyEarning.model')(sequelize);
const DepositScreenshot = require('./depositScreenshot.model')(sequelize);


// ── Associations ──────────────────────────────────────────────────────────────

// User ↔ Transaction / Investment / RefreshToken / Notification / ActivityLog
User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Investment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Investment.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ActivityLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
ActivityLog.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks', onDelete: 'SET NULL' });
Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

// Messages (self-referencing User)
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// SupportConversations associations
User.hasMany(SupportConversation, { foreignKey: 'userId', as: 'supportConversations', onDelete: 'CASCADE' });
SupportConversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(SupportConversation, { foreignKey: 'assignedAdminId', as: 'assignedConversations', onDelete: 'SET NULL' });
SupportConversation.belongsTo(User, { foreignKey: 'assignedAdminId', as: 'assignedAdmin' });

SupportConversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(SupportConversation, { foreignKey: 'conversationId', as: 'conversation' });

// Department ↔ Employee
Department.hasMany(Employee, { foreignKey: 'departmentId', onDelete: 'SET NULL' });
Employee.belongsTo(Department, { foreignKey: 'departmentId' });

// Employee ↔ Attendance / LeaveRequest / Payroll
Employee.hasMany(Attendance, { foreignKey: 'employeeId', onDelete: 'CASCADE' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId', onDelete: 'CASCADE' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId' });

Employee.hasMany(Payroll, { foreignKey: 'employeeId', onDelete: 'CASCADE' });
Payroll.belongsTo(Employee, { foreignKey: 'employeeId' });

// Project ↔ Task / ProjectTeam / Document / Client
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectTeam, { foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectTeam.belongsTo(Project, { foreignKey: 'projectId' });

Employee.hasMany(ProjectTeam, { foreignKey: 'employeeId', onDelete: 'CASCADE' });
ProjectTeam.belongsTo(Employee, { foreignKey: 'employeeId' });

Project.hasMany(Document, { foreignKey: 'projectId', onDelete: 'SET NULL', constraints: false });
Document.belongsTo(Project, { foreignKey: 'projectId', constraints: false });

Client.hasMany(Project, { foreignKey: 'clientId', onDelete: 'SET NULL' });
Project.belongsTo(Client, { foreignKey: 'clientId' });

// Budget optional FK (project or department)
Budget.belongsTo(Project, { foreignKey: 'projectId', constraints: false });
Budget.belongsTo(Department, { foreignKey: 'departmentId', constraints: false });

// ── Trading Associations ────────────────────────────────────────────────────────
User.hasOne(TradingWallet, { foreignKey: 'userId', as: 'tradingWallet', onDelete: 'CASCADE' });
TradingWallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserPortfolio, { foreignKey: 'userId', as: 'portfolios', onDelete: 'CASCADE' });
UserPortfolio.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Coin.hasMany(UserPortfolio, { foreignKey: 'coinId', as: 'portfolios', onDelete: 'CASCADE' });
UserPortfolio.belongsTo(Coin, { foreignKey: 'coinId', as: 'coin' });

User.hasMany(BuyTransaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
BuyTransaction.belongsTo(User, { foreignKey: 'userId' });
Coin.hasMany(BuyTransaction, { foreignKey: 'coinId', onDelete: 'CASCADE' });
BuyTransaction.belongsTo(Coin, { foreignKey: 'coinId' });

User.hasMany(SellTransaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
SellTransaction.belongsTo(User, { foreignKey: 'userId' });
Coin.hasMany(SellTransaction, { foreignKey: 'coinId', onDelete: 'CASCADE' });
SellTransaction.belongsTo(Coin, { foreignKey: 'coinId' });

User.hasMany(TradingTransfer, { foreignKey: 'userId', onDelete: 'CASCADE' });
TradingTransfer.belongsTo(User, { foreignKey: 'userId' });

// DepositScreenshot associations
User.hasMany(DepositScreenshot, { foreignKey: 'userId', onDelete: 'CASCADE' });
DepositScreenshot.belongsTo(User, { foreignKey: 'userId' });
Transaction.hasOne(DepositScreenshot, { foreignKey: 'transactionId', as: 'depositScreenshot', onDelete: 'SET NULL' });
DepositScreenshot.belongsTo(Transaction, { foreignKey: 'transactionId' });

// DailyEarning associations
Investment.hasMany(DailyEarning, { foreignKey: 'investmentId', as: 'dailyEarnings', onDelete: 'CASCADE' });
DailyEarning.belongsTo(Investment, { foreignKey: 'investmentId', as: 'investment' });
User.hasMany(DailyEarning, { foreignKey: 'userId', as: 'dailyEarnings', onDelete: 'CASCADE' });
DailyEarning.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Employee,
  Department,
  Project,
  ProjectTeam,
  Client,
  Event,
  Task,
  Revenue,
  Expense,
  Budget,
  Payroll,
  Attendance,
  LeaveRequest,
  Partnership,
  Document,
  Notification,
  ActivityLog,
  Announcement,
  Report,
  Message,
  Transaction,
  Investment,
  RefreshToken,
  SupportConversation,
  Coin,
  TradingWallet,
  UserPortfolio,
  BuyTransaction,
  SellTransaction,
  TradingTransfer,
  TradingSetting,
  VipPlan,
  DailyEarning,
  DepositScreenshot,
};
