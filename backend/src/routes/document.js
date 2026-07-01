const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const upload = require('../services/upload');

router.use(auth);

router.get('/', authorize(['CEO', 'Chairman', 'Project Manager', 'HR Manager', 'Operations Manager', 'Staff']), documentController.getAllDocuments);
router.post('/upload', authorize(['CEO', 'Project Manager', 'HR Manager', 'Operations Manager', 'Staff', 'Client']), upload.single('file'), documentController.uploadDocument);
router.get('/:id/download', authorize(['CEO', 'Chairman', 'Project Manager', 'HR Manager', 'Operations Manager', 'Staff', 'Client']), documentController.downloadDocument);
router.delete('/:id', authorize(['CEO', 'Chairman', 'Project Manager']), documentController.deleteDocument);

module.exports = router;
