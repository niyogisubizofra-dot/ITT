const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

router.use(authenticate, adminOnly);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/balance', ctrl.updateBalance);

module.exports = router;
