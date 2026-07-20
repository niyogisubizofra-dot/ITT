const router = require('express').Router();
const ctrl = require('../controllers/project.controller');
const { authenticate, managerUp } = require('../middleware/auth');
const { projectRules } = require('../validations/common.validation');
const validate = require('../middleware/validate');

router.use(authenticate, managerUp);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', projectRules, validate, ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/team', ctrl.assignTeam);
router.delete('/:id/team/:employeeId', ctrl.removeTeamMember);
router.patch('/:id/progress', ctrl.updateProgress);
router.get('/:id/documents', ctrl.getDocuments);

module.exports = router;
