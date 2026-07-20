/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerRules, loginRules, changePasswordRules,
  forgotPasswordRules, resetPasswordRules,
} = require('../validations/auth.validation');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               ref: { type: string }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Validation error }
 */
router.post('/register', registerRules, validate, ctrl.register);
router.post('/login', loginRules, validate, ctrl.login);
router.post('/verify-2fa', ctrl.verify2FA);
router.post('/refresh-token', ctrl.refreshToken);
router.post('/logout', ctrl.logout);
router.post('/forgot-password', forgotPasswordRules, validate, ctrl.forgotPassword);
router.post('/reset-password', resetPasswordRules, validate, ctrl.resetPassword);

// Protected
router.get('/user', authenticate, ctrl.getMe);
router.post('/change-password', authenticate, changePasswordRules, validate, ctrl.changePassword);
router.post('/setup-2fa', authenticate, ctrl.setup2FA);
router.post('/enable-2fa', authenticate, ctrl.enable2FA);
router.post('/disable-2fa', authenticate, ctrl.disable2FA);

module.exports = router;
