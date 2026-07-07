const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const { User, RefreshToken } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateReferralCode } = require('../utils/helpers');
const { sendPasswordReset, sendWelcome } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const { emitDashboardUpdate } = require('../sockets');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, ref } = req.body;

    // Single query to check both email and username uniqueness
    const { Op } = require('sequelize');
    const existing = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
    if (existing) {
      if (existing.email === email) return res.status(400).json({ error: 'Email already registered' });
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Run bcrypt hash and referral lookup in parallel
    const [hashed, referrer] = await Promise.all([
      bcrypt.hash(password, 10), // Cost 10: still secure, ~75% faster than 12
      ref ? User.findOne({ where: { referralCode: ref } }) : Promise.resolve(null),
    ]);

    const referralCode = generateReferralCode();
    const referredBy = referrer ? referrer.id : null;

    const user = await User.create({ username, email, password: hashed, referralCode, referredBy });

    // Notify admin dashboard in real time about the new registration
    setImmediate(() => emitDashboardUpdate('newUser', {
      id: user.id,
      username: user.username,
      email: user.email,
      balance: parseFloat(user.balance) || 0,
      status: user.status || 'active',
      role: user.role,
      referralCode: user.referralCode,
      investments: 0,
      joined: user.createdAt,
    }));

    // Award referral bonuses and send welcome email as background tasks (non-blocking)
    if (referredBy) {
      const { awardReferralBonus } = require('./referral.controller');
      setImmediate(() => awardReferralBonus(referredBy, user.id));
    }
    setImmediate(() => sendWelcome(email, username)); // Fire-and-forget — don't block response

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req.ip);

    res.status(201).json({
      msg: 'Registration successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance, referralCode: user.referralCode },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: email.includes('@') ? { email } : { username: email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      return res.status(200).json({ requires2FA: true, userId: user.id });
    }

    await user.update({ lastLogin: new Date() });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req.ip);

    res.json({
      msg: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance, referralCode: user.referralCode, avatar: user.avatar },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.verify2FA = async (req, res, next) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!isValid) return res.status(401).json({ error: 'Invalid 2FA code' });

    await user.update({ lastLogin: new Date() });
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req.ip);

    res.json({
      msg: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.setup2FA = async (req, res, next) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email, 'INVEST Platform', secret);
    const qrCode = await qrcode.toDataURL(otpauth);

    await req.user.update({ twoFactorSecret: secret });
    res.json({ secret, qrCode });
  } catch (err) {
    next(err);
  }
};

exports.enable2FA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const isValid = authenticator.verify({ token, secret: req.user.twoFactorSecret });
    if (!isValid) return res.status(400).json({ error: 'Invalid token' });

    await req.user.update({ twoFactorEnabled: true });
    res.json({ msg: '2FA enabled successfully' });
  } catch (err) {
    next(err);
  }
};

exports.disable2FA = async (req, res, next) => {
  try {
    await req.user.update({ twoFactorEnabled: false, twoFactorSecret: null });
    res.json({ msg: '2FA disabled' });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = verifyRefreshToken(refreshToken);
    const stored = await RefreshToken.findOne({ where: { token: refreshToken, isRevoked: false } });

    if (!stored || new Date() > stored.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    await stored.update({ isRevoked: true });
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user, req.ip);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.update({ isRevoked: true }, { where: { token: refreshToken } });
    }
    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    // Always fetch fresh from DB so balance is current
    const user = await require('../models').User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'twoFactorSecret', 'resetPasswordToken', 'resetPasswordExpires'] },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    await user.update({ password: await bcrypt.hash(newPassword, 12) });
    await RefreshToken.update({ isRevoked: true }, { where: { userId: user.id } });

    res.json({ msg: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) return res.json({ msg: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({ resetPasswordToken: token, resetPasswordExpires: expires });
    await sendPasswordReset(email, token);

    res.json({ msg: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ where: { resetPasswordToken: token } });

    if (!user || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    await user.update({
      password: await bcrypt.hash(password, 12),
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    res.json({ msg: 'Password reset successful. Please log in.' });
  } catch (err) {
    next(err);
  }
};
