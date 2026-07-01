const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../validations/schemas');
const upload = require('../services/upload');

router.use(auth);

// Project CRUD
router.get('/', authorize(['CEO', 'Chairman', 'Project Manager', 'Operations Manager', 'Finance Manager', 'Client']), projectController.getAllProjects);
router.get('/:id', authorize(['CEO', 'Chairman', 'Project Manager', 'Operations Manager', 'Client']), projectController.getProjectById);
router.post('/', authorize(['CEO', 'Chairman', 'Project Manager', 'Operations Manager']), validate(schemas.project), projectController.createProject);
router.put('/:id', authorize(['CEO', 'Chairman', 'Project Manager', 'Operations Manager']), validate(schemas.project), projectController.updateProject);
router.delete('/:id', authorize(['CEO', 'Chairman', 'Project Manager']), projectController.deleteProject);

// Assign team member
router.post('/team', authorize(['CEO', 'Project Manager', 'Operations Manager']), projectController.assignTeamMember);

// File uploads
router.post('/document', authorize(['CEO', 'Project Manager', 'Operations Manager', 'Staff']), upload.single('file'), projectController.uploadProjectDocument);

// Reports
router.post('/:id/report', authorize(['CEO', 'Project Manager', 'Finance Manager']), projectController.generateProjectReport);

module.exports = router;
