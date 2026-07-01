const sequelize = require('../config/db');

// Import all models
const User = require('./User');
const Employee = require('./Employee');
const Project = require('./Project');
const ProjectTeam = require('./ProjectTeam');
const Client = require('./Client');
const Event = require('./Event');
const Task = require('./Task');
const Department = require('./Department');
const Revenue = require('./Revenue');
const Expense = require('./Expense');
const Budget = require('./Budget');
const Payroll = require('./Payroll');
const Attendance = require('./Attendance');
const LeaveRequest = require('./LeaveRequest');
const Partnership = require('./Partnership');
const Document = require('./Document');
const Notification = require('./Notification');
const ActivityLog = require('./ActivityLog');
const Announcement = require('./Announcement');
const Report = require('./Report');
const Transaction = require('./Transaction');
const Message = require('./Message');

// --- Associations ---

// User <-> Employee (One-to-One)
User.hasOne(Employee, { foreignKey: 'userId', as: 'employeeProfile', onDelete: 'CASCADE' });
Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Employee <-> Department (Many-to-One)
Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees', onDelete: 'SET NULL' });
Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Department <-> User (Manager) (Many-to-One)
User.hasMany(Department, { foreignKey: 'managerId', as: 'managedDepartments', onDelete: 'SET NULL' });
Department.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// Project <-> Client (Many-to-One)
Client.hasMany(Project, { foreignKey: 'clientId', as: 'projects', onDelete: 'SET NULL' });
Project.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Project <-> Employee (Many-to-Many via ProjectTeam)
Project.belongsToMany(Employee, { through: ProjectTeam, foreignKey: 'projectId', as: 'teamMembers' });
Employee.belongsToMany(Project, { through: ProjectTeam, foreignKey: 'employeeId', as: 'assignedProjects' });
ProjectTeam.belongsTo(Project, { foreignKey: 'projectId' });
ProjectTeam.belongsTo(Employee, { foreignKey: 'employeeId' });

// Project <-> Task (One-to-Many)
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Employee <-> Task (One-to-Many)
Employee.hasMany(Task, { foreignKey: 'assigneeId', as: 'tasks', onDelete: 'SET NULL' });
Task.belongsTo(Employee, { foreignKey: 'assigneeId', as: 'assignee' });

// Event <-> User (Organizer) (Many-to-One)
User.hasMany(Event, { foreignKey: 'organizerId', as: 'organizedEvents', onDelete: 'SET NULL' });
Event.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });

// Expense <-> User (Approver) (Many-to-One)
User.hasMany(Expense, { foreignKey: 'approvedById', as: 'approvedExpenses', onDelete: 'SET NULL' });
Expense.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

// Employee <-> Payroll (One-to-Many)
Employee.hasMany(Payroll, { foreignKey: 'employeeId', as: 'payrolls', onDelete: 'CASCADE' });
Payroll.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee <-> Attendance (One-to-Many)
Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendanceLogs', onDelete: 'CASCADE' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee <-> LeaveRequest (One-to-Many)
Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId', as: 'leaveRequests', onDelete: 'CASCADE' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// LeaveRequest <-> User (Approver) (Many-to-One)
User.hasMany(LeaveRequest, { foreignKey: 'approvedById', as: 'approvedLeaves', onDelete: 'SET NULL' });
LeaveRequest.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

// Document <-> Project (Many-to-One)
Project.hasMany(Document, { foreignKey: 'projectId', as: 'documents', onDelete: 'CASCADE' });
Document.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Document <-> User (Uploader) (Many-to-One)
User.hasMany(Document, { foreignKey: 'uploadedById', as: 'documents', onDelete: 'SET NULL' });
Document.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

// Notification <-> User (One-to-Many)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ActivityLog <-> User (One-to-Many)
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs', onDelete: 'CASCADE' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Announcement <-> User (Creator) (Many-to-One)
User.hasMany(Announcement, { foreignKey: 'createdById', as: 'announcements', onDelete: 'SET NULL' });
Announcement.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// Report <-> User (Creator) (Many-to-One)
User.hasMany(Report, { foreignKey: 'createdById', as: 'reports', onDelete: 'SET NULL' });
Report.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// Transaction <-> User (One-to-Many)
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User Referral self-association
User.belongsTo(User, { foreignKey: 'referredBy', as: 'referrer' });
User.hasMany(User, { foreignKey: 'referredBy', as: 'referrals' });

// Message associations
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

module.exports = {
  sequelize,
  User,
  Employee,
  Project,
  ProjectTeam,
  Client,
  Event,
  Task,
  Department,
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
  Transaction,
  Message
};
