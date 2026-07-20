const router = require('express').Router();
const ctrl = require('../controllers/document.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.post('/upload', upload.single('file'), ctrl.upload);
router.get('/:id/download', ctrl.download);
router.delete('/:id', ctrl.remove);

module.exports = router;
