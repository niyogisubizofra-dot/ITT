const router = require('express').Router();
const ctrl = require('../controllers/task.controller');
const { authenticate, managerUp } = require('../middleware/auth');
const { taskRules } = require('../validations/common.validation');
const validate = require('../middleware/validate');

// User-facing endpoints (accessible by regular authenticated users)
router.get('/my-tasks', authenticate, ctrl.getMyTasks);
router.put('/my-tasks/:id/complete', authenticate, ctrl.completeMyTask);

// Admin/Manager endpoints
router.use(authenticate, managerUp);

router.get('/', ctrl.getAll);
router.post('/bulk', taskRules, validate, ctrl.createBulk);
router.get('/:id', ctrl.getOne);
router.post('/', taskRules, validate, ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
