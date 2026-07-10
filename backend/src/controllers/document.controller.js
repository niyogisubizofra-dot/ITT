const path = require('path');
const fs = require('fs');
const { Document } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { category } = req.query;
    const where = {};
    if (category) where.category = category;

    const { count, rows } = await Document.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const doc = await Document.create({
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      path: req.file.cloudinaryUrl || `uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      category: req.body.category || 'General',
      projectId: req.body.projectId || null,
      uploadedBy: req.user.id,
      description: req.body.description,
      isPublic: req.body.isPublic === 'true',
    });

    res.status(201).json({ ...doc.toJSON(), path: req.file.cloudinaryUrl || `uploads/${req.file.filename}` });
  } catch (err) { next(err); }
};

exports.download = async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.path.startsWith('http')) {
      return res.redirect(doc.path);
    }

    const filePath = path.join(__dirname, '../../', doc.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    res.download(filePath, doc.originalName || doc.name);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const filePath = path.join(__dirname, '../../', doc.path);
    if (!doc.path.startsWith('http') && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await doc.destroy();
    res.json({ msg: 'Document deleted' });
  } catch (err) { next(err); }
};
