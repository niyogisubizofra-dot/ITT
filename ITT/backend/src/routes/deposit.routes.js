const router = require('express').Router();
const ctrl = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const crypto = require('crypto');
const fs = require('fs');
const { DepositScreenshot } = require('../models');

// GET /api/deposit/history - user views their deposits
router.get('/history', authenticate, ctrl.getMyDeposits);

// GET /api/deposit/account-activity - user views account activity timeline
router.get('/account-activity', authenticate, ctrl.getAccountActivity);

// GET /api/deposit/transaction/:id - get transaction details for confirmation page
router.get('/transaction/:id', authenticate, ctrl.getTransactionById);

// POST /api/deposit/notify  — user notifies admin of manual deposit
router.post('/notify', authenticate, ctrl.notifyDeposit);

// POST /api/deposit/screenshot  — upload deposit screenshot
router.post('/screenshot', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Validate size (handled by Multer config, but double check)
    // Validate format: JPG, JPEG, PNG, PDF
    const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
    const path = require('path');
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File type not allowed. Please upload JPG, JPEG, PNG, or PDF.' });
    }

    // Compute hash to prevent duplicate uploads
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const existing = await DepositScreenshot.findOne({ where: { hash: fileHash } });
    if (existing) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Duplicate screenshot detected. This proof has already been uploaded.' });
    }

    // Save screenshot record
    const screenshot = await DepositScreenshot.create({
      userId: req.user.id,
      path: `uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      hash: fileHash,
    });

    res.json({
      path: screenshot.path,
      id: screenshot.id,
      msg: 'Your payment proof has been uploaded successfully and is awaiting admin verification.',
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
});

module.exports = router;
