const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const { DepositScreenshot } = require('../models');
const { authenticate } = require('../middleware/auth');

const mimeTypes = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

router.get('/screenshots/:filename', authenticate, async (req, res, next) => {
  try {
    const { filename } = req.params;
    const cleanFilename = path.basename(filename);

    const filePath = path.resolve(__dirname, '../uploads', cleanFilename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Optional DB permission check: Admin can view anything; users check ownership if record exists
    if (req.user.role !== 'Admin') {
      const screenshot = await DepositScreenshot.findOne({ where: { filename: cleanFilename } });
      if (screenshot && screenshot.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view this screenshot' });
      }
    }

    const ext = path.extname(cleanFilename).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
