const router = require('express').Router();
const ctrl = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/deposit/notify  — user notifies admin of manual deposit
router.post('/notify', authenticate, ctrl.notifyDeposit);

// POST /api/deposit/screenshot  — upload deposit screenshot
router.post('/screenshot', authenticate, upload.single('file'), upload.uploadToCloudinary, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ path: req.file.cloudinaryUrl || `uploads/${req.file.filename}`, msg: 'Screenshot uploaded' });
  } catch (err) { next(err); }
});

module.exports = router;
