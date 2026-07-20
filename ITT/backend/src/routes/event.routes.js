const router = require('express').Router();
const ctrl = require('../controllers/event.controller');
const { authenticate, managerUp } = require('../middleware/auth');

router.use(authenticate, managerUp);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/guests', ctrl.addGuest);

module.exports = router;
