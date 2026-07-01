const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../validations/schemas');

router.use(auth);

// Client CRUD
router.get('/', authorize(['CEO', 'Chairman', 'Operations Manager', 'Project Manager']), clientController.getAllClients);
router.get('/:id', authorize(['CEO', 'Chairman', 'Operations Manager', 'Project Manager']), clientController.getClientById);
router.post('/', authorize(['CEO', 'Chairman', 'Operations Manager']), validate(schemas.client), clientController.createClient);
router.put('/:id', authorize(['CEO', 'Chairman', 'Operations Manager']), validate(schemas.client), clientController.updateClient);
router.delete('/:id', authorize(['CEO', 'Chairman']), clientController.deleteClient);

// Client portal/feedback endpoints
router.post('/service-request', authorize(['Client', 'Operations Manager', 'CEO']), clientController.submitServiceRequest);
router.post('/feedback', authorize(['Client', 'CEO']), clientController.submitFeedback);
router.post('/contract', authorize(['CEO', 'Chairman', 'Operations Manager']), clientController.manageContract);

module.exports = router;
