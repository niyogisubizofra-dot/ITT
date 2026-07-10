const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|csv|txt|zip/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.test(ext)) return cb(null, true);
  cb(new Error('File type not allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024 },
});

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'xsyu1vh0',
  api_key: process.env.CLOUDINARY_API_KEY || '399389216355614',
  api_secret: process.env.CLOUDINARY_API_SECRET || '-HO1drNBZlJ8Vvx9lxr6LfSyK2w',
});

const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'invest_platform',
      resource_type: 'auto',
    });
    req.file.cloudinaryUrl = result.secure_url;
    
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to delete local upload file:', err);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
  }
  next();
};

upload.uploadToCloudinary = uploadToCloudinary;

module.exports = upload;
