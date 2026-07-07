const router = require('express').Router();
const ctrl = require('../controllers/leave.controller');
const { authenticate, managerUp } = require('../middleware/auth');
const { leaveRules } = require('../validations/common.validation');
const validate = require('../middleware/validate');

router.use(authenticate, managerUp);

router.get('/', ctrl.getAll);
router.post('/', leaveRules, validate, ctrl.create);
router.patch('/:id/approve', ctrl.approve);
router.patch('/:id/reject', ctrl.reject);
router.delete('/:id', ctrl.remove);

module.exports = router;
