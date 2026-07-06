const Joi = require('joi');

const schemas = {
  // Auth
  register: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(3).required(),
    ref: Joi.string().allow(null, '')
  }),
  login: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
  }),
  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(3).required()
  }),
  resetPasswordRequest: Joi.object({
    email: Joi.string().email().required()
  }),
  resetPasswordConfirm: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(3).required()
  }),
  verify2FA: Joi.object({
    token: Joi.string().length(6).required()
  }),

  // Users
  userUpdate: Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    role: Joi.string().valid('CEO', 'Chairman', 'Manager', 'Project Manager', 'Finance Manager', 'Operations Manager', 'HR Manager', 'Staff', 'Client'),
    balance: Joi.number().precision(2)
  }),

  // Employee
  employee: Joi.object({
    userId: Joi.number().integer().required(),
    departmentId: Joi.number().integer().allow(null),
    position: Joi.string().required(),
    salary: Joi.number().precision(2).required(),
    hireDate: Joi.string().isoDate(),
    status: Joi.string().valid('Active', 'Terminated', 'On Leave')
  }),

  // Project
  project: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('Planning', 'In Progress', 'Completed', 'On Hold'),
    budget: Joi.number().precision(2).required(),
    startDate: Joi.string().isoDate().allow(null),
    endDate: Joi.string().isoDate().allow(null),
    clientId: Joi.number().integer().allow(null)
  }),

  // Client
  client: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('', null),
    company: Joi.string().allow('', null),
    status: Joi.string().valid('Active', 'Inactive')
  }),

  // Task
  task: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('Pending', 'In Progress', 'Completed'),
    priority: Joi.string().valid('Low', 'Medium', 'High'),
    projectId: Joi.number().integer().allow(null),
    assigneeId: Joi.number().integer().allow(null),
    dueDate: Joi.string().isoDate().allow(null)
  }),

  // Department
  department: Joi.object({
    name: Joi.string().required(),
    managerId: Joi.number().integer().allow(null)
  }),

  // Revenue & Expense
  revenue: Joi.object({
    amount: Joi.number().precision(2).positive().required(),
    category: Joi.string().required(),
    date: Joi.string().isoDate(),
    description: Joi.string().allow('', null)
  }),
  expense: Joi.object({
    amount: Joi.number().precision(2).positive().required(),
    category: Joi.string().required(),
    date: Joi.string().isoDate(),
    description: Joi.string().allow('', null),
    approvedById: Joi.number().integer().allow(null)
  }),

  // Budget
  budget: Joi.object({
    amount: Joi.number().precision(2).positive().required(),
    category: Joi.string().required(),
    year: Joi.number().integer().min(2000).required(),
    month: Joi.number().integer().min(1).max(12).required(),
    spentAmount: Joi.number().precision(2).default(0)
  }),

  // Payroll
  payroll: Joi.object({
    employeeId: Joi.number().integer().required(),
    amount: Joi.number().precision(2).positive().required(),
    bonus: Joi.number().precision(2).default(0),
    deductions: Joi.number().precision(2).default(0),
    payDate: Joi.string().isoDate().required(),
    status: Joi.string().valid('Paid', 'Pending')
  }),

  // LeaveRequest
  leaveRequest: Joi.object({
    employeeId: Joi.number().integer().required(),
    type: Joi.string().valid('Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid').required(),
    startDate: Joi.string().isoDate().required(),
    endDate: Joi.string().isoDate().required(),
    status: Joi.string().valid('Pending', 'Approved', 'Rejected'),
    approvedById: Joi.number().integer().allow(null)
  }),

  // Attendance
  attendance: Joi.object({
    employeeId: Joi.number().integer().required(),
    date: Joi.string().isoDate().required(),
    checkIn: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/).allow(null),
    checkOut: Joi.string().regex(/^([0-9]{2}):([0-9]{2})$/).allow(null),
    status: Joi.string().valid('Present', 'Absent', 'Late', 'Half Day')
  }),

  // Partnership
  partnership: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('Sponsor', 'Investor', 'Strategic', 'Vendor').required(),
    contactPerson: Joi.string().allow('', null),
    email: Joi.string().email().required(),
    status: Joi.string().valid('Proposed', 'Active', 'Terminated'),
    fundingAmount: Joi.number().precision(2).default(0)
  })
};

module.exports = schemas;
