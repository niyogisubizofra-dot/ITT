const router = require('express').Router();
const finCtrl = require('../controllers/finance.controller');
const { authenticate, managerUp, adminOnly } = require('../middleware/auth');
const { financeRules } = require('../validations/common.validation');
const validate = require('../middleware/validate');

router.use(authenticate, managerUp);

router.get('/', finCtrl.getAllRevenue);
router.post('/', financeRules, validate, finCtrl.createRevenue);
router.put('/:id', finCtrl.updateRevenue);
router.delete('/:id', finCtrl.deleteRevenue);

module.exports = router;
