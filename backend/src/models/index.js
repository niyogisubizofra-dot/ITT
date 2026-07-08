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
};
