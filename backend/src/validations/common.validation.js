const { body } = require('express-validator');

const employeeRules = [
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
];

const projectRules = [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be positive'),
];

const taskRules = [
  body('title').trim().notEmpty().withMessage('Task title required'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
];

const financeRules = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').isDate().withMessage('Valid date required'),
];

const leaveRules = [
  body('type').isIn(['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other']).withMessage('Invalid leave type'),
  body('startDate').isDate().withMessage('Valid start date required'),
  body('endDate').isDate().withMessage('Valid end date required'),
];

module.exports = { employeeRules, projectRules, taskRules, financeRules, leaveRules };
