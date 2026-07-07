const router = require('express').Router();
const ctrl = require('../controllers/payroll.controller');
const { authenticate, managerUp } = require('../middleware/auth');

router.use(authenticate, managerUp);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/pay', ctrl.markPaid);
router.delete('/:id', ctrl.remove);

module.exports = router;
