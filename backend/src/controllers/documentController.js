const { Document } = require('../models');
const fs = require('fs');
const path = require('path');

exports.getAllDocuments = async (req, res, next) => {
  try {
    const documents = await Document.findAll();
    res.json(documents);
  } catch (err) {
    next(err);
  }
};

exports.uploadDocument = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }
  const { category, projectId } = req.body;
  try {
    const filePath = req.file.path.startsWith('http') 
      ? req.file.path 
      : path.relative(path.join(__dirname, '../../'), req.file.path);

    const doc = await Document.create({
      name: req.file.originalname,
      path: filePath,
      category: category || 'General',
      projectId: projectId || null,
      uploadedById: req.user.id
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Document not found' });

    const fullPath = path.join(__dirname, '../../', doc.path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ msg: 'File does not exist on disk' });
    }

    res.download(fullPath, doc.name);
  } catch (err) {
    next(err);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ msg: 'Document not found' });

    const fullPath = path.join(__dirname, '../../', doc.path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await doc.destroy();
    res.json({ msg: 'Document deleted successfully from DB and filesystem' });
  } catch (err) {
    next(err);
  }
};
