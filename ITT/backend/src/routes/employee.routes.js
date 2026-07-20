const router = require('express').Router();
const ctrl = require('../controllers/employee.controller');
const { authenticate, managerUp } = require('../middleware/auth');
const { employeeRules } = require('../validations/common.validation');
const validate = require('../middleware/validate');
const auditLog = require('../middleware/auditLog');

router.use(authenticate, managerUp);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', employeeRules, validate, auditLog('CREATE_EMPLOYEE', 'Employee'), ctrl.create);
router.put('/:id', auditLog('UPDATE_EMPLOYEE', 'Employee'), ctrl.update);
router.delete('/:id', auditLog('DELETE_EMPLOYEE', 'Employee'), ctrl.remove);

// Sub-resources
router.get('/:id/attendance', ctrl.getAttendance);
router.post('/:id/attendance', ctrl.markAttendance);
router.get('/:id/leaves', ctrl.getLeaves);
router.get('/:id/payroll', ctrl.getPayroll);
router.get('/:id/performance', ctrl.getPerformance);

module.exports = router;
