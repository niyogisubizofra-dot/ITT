const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../validations/schemas');

router.use(auth);

// Employee CRUD - HR Manager, CEO, Chairman
router.get('/', authorize(['CEO', 'Chairman', 'HR Manager', 'Operations Manager']), employeeController.getAllEmployees);
router.get('/:id', authorize(['CEO', 'Chairman', 'HR Manager']), employeeController.getEmployeeById);
router.post('/', authorize(['CEO', 'Chairman', 'HR Manager']), validate(schemas.employee), employeeController.createEmployee);
router.put('/:id', authorize(['CEO', 'Chairman', 'HR Manager']), validate(schemas.employee), employeeController.updateEmployee);
router.delete('/:id', authorize(['CEO', 'Chairman', 'HR Manager']), employeeController.deleteEmployee);

// Attendance - Clock in/out, view stats
router.post('/attendance', authorize(['CEO', 'HR Manager', 'Operations Manager', 'Staff']), validate(schemas.attendance), employeeController.logAttendance);
router.get('/:employeeId/attendance', authorize(['CEO', 'HR Manager', 'Operations Manager', 'Staff']), employeeController.getAttendanceLogs);

// Payroll - CEO, Finance Manager, HR Manager
router.post('/payroll', authorize(['CEO', 'Finance Manager', 'HR Manager']), validate(schemas.payroll), employeeController.createPayroll);
router.post('/payroll/:id/pay', authorize(['CEO', 'Finance Manager']), employeeController.processPayrollPayment);
router.get('/:employeeId/payroll', authorize(['CEO', 'Finance Manager', 'HR Manager', 'Staff']), employeeController.getPayrollLogs);

// Leaves - staff requests, HR Manager/CEO reviews
router.post('/leave', authorize(['Staff', 'HR Manager', 'Operations Manager', 'Project Manager']), validate(schemas.leaveRequest), employeeController.requestLeave);
router.post('/leave/:id/approve', authorize(['CEO', 'HR Manager']), employeeController.approveLeave);

module.exports = router;
