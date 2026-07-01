const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validations/schemas');

// Public auth routes
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.post('/verify-2fa', validate(schemas.verify2FA), authController.verify2FA);
router.post('/logout', auth, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(schemas.resetPasswordRequest), authController.forgotPassword);
router.post('/reset-password', validate(schemas.resetPasswordConfirm), authController.resetPassword);

// Private auth routes (require JWT verification)
router.post('/change-password', auth, validate(schemas.changePassword), authController.changePassword);
router.post('/setup-2fa', auth, authController.setup2FA);
router.post('/confirm-2fa', auth, validate(schemas.verify2FA), authController.confirm2FA);

// Get currently authenticated user data
router.get('/user', auth, async (req, res, next) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Get all users (useful for client/admin operations)
router.get('/all-users', auth, async (req, res, next) => {
  try {
    const { User } = require('../models');
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
