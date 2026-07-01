const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Transaction, sequelize } = require('../models');
const { sendMail } = require('../services/mail');
const { logActivity } = require('../services/audit');
const { generateSecret, generateOtpauthUri, verifyToken } = require('../utils/twoFactor');
require('dotenv').config();

// Helper to sign JWTs
function generateTokens(user) {
  const payload = { user: { id: user.id, username: user.username, role: user.role } };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'supersecretjwtkey_12345', { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkey_54321', { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

exports.register = async (req, res, next) => {
  const { username, email, password, ref } = req.body;
  const t = await sequelize.transaction();

  try {
    let user = await User.findOne({ where: { email } }, { transaction: t });
    if (user) {
      await t.rollback();
      return res.status(400).json({ msg: 'User already exists' });
    }

    let referredById = null;
    let referrer = null;
    if (ref) {
      referrer = await User.findOne({ where: { referralCode: ref } }, { transaction: t });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const unqPrefix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const referralCode = `USER${unqPrefix}`;

    user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      referralCode,
      referredBy: referredById,
      balance: referredById ? 0.05 : 0.00
    }, { transaction: t });

    if (referredById && referrer) {
      // Direct referral bonus (Level 1)
      referrer.balance = parseFloat(referrer.balance || 0) + 0.10;
      referrer.referralEarnings = parseFloat(referrer.referralEarnings || 0) + 0.10;
      await referrer.save({ transaction: t });

      await Transaction.create({
        userId: referrer.id,
        type: 'referral_bonus',
        amount: 0.10,
        description: `Referral bonus for inviting ${username}`
      }, { transaction: t });

      await Transaction.create({
        userId: user.id,
        type: 'referral_bonus',
        amount: 0.05,
        description: `Welcome bonus for registering with a referral link`
      }, { transaction: t });
    }

    await t.commit();

    // Log security activity
    await logActivity(user.id, 'Register', req.ip, 'User registered successfully');

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 mins
    }).json({
      msg: 'Registered successfully',
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance }
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      await logActivity(null, 'Login Failed', req.ip, `Email not found: ${email}`);
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logActivity(user.id, 'Login Failed', req.ip, 'Incorrect password');
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Check if 2FA is active
    if (user.is2FAEnabled) {
      // Return a temporary token or flow flag requiring 2FA verification
      const tempPayload = { user: { id: user.id, temp: true } };
      const tempToken = jwt.sign(tempPayload, process.env.JWT_SECRET || 'supersecretjwtkey_12345', { expiresIn: '5m' });
      return res.json({
        msg: '2FA verification required',
        twoFactorRequired: true,
        tempToken
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    await logActivity(user.id, 'Login Success', req.ip);

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15m
    }).json({
      msg: 'Logged in successfully',
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance }
    });
  } catch (err) {
    next(err);
  }
};

exports.verify2FA = async (req, res, next) => {
  const { token, tempToken } = req.body;
  try {
    let userId;
    try {
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'supersecretjwtkey_12345');
      userId = decoded.user.id;
    } catch (err) {
      return res.status(401).json({ msg: 'Temporary session expired or invalid' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.twoFASecret) {
      return res.status(400).json({ msg: '2FA is not configured for this user' });
    }

    const isValid = verifyToken(token, user.twoFASecret);
    if (!isValid) {
      await logActivity(user.id, '2FA Code Invalid', req.ip);
      return res.status(400).json({ msg: 'Invalid 2FA token code' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    await logActivity(user.id, 'Login Success (2FA)', req.ip);

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    }).json({
      msg: '2FA Verified. Logged in successfully',
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance }
    });
  } catch (err) {
    next(err);
  }
};

exports.setup2FA = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const secret = generateSecret();
    const otpauthUri = generateOtpauthUri(user.username, secret);

    user.twoFASecretTemp = secret;
    await user.save();

    res.json({
      msg: '2FA Setup generated. Verify the code to enable.',
      secret,
      otpauthUri
    });
  } catch (err) {
    next(err);
  }
};

exports.confirm2FA = async (req, res, next) => {
  const { token } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.twoFASecretTemp) {
      return res.status(400).json({ msg: 'Initiate 2FA setup first' });
    }

    const isValid = verifyToken(token, user.twoFASecretTemp);
    if (!isValid) {
      return res.status(400).json({ msg: 'Invalid token code. Enable failed.' });
    }

    user.twoFASecret = user.twoFASecretTemp;
    user.twoFASecretTemp = null;
    user.is2FAEnabled = true;
    await user.save();

    await logActivity(user.id, '2FA Enabled', req.ip);

    res.json({ msg: '2FA has been successfully enabled' });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findByPk(req.user.id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
      await logActivity(req.user.id, 'Logout', req.ip);
    }
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) })
       .json({ msg: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ msg: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'supersecretjwtrefreshkey_54321');
    const user = await User.findByPk(decoded.user.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ msg: 'Token is invalid or expired' });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.cookie('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    }).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    res.status(401).json({ msg: 'Token is invalid or expired' });
  }
};

exports.changePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect current password' });
    }

    user.password = newPassword; // hash beforeUpdate sequelize hook will hash it
    await user.save();

    await logActivity(user.id, 'Change Password', req.ip);
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ msg: 'No user registered with this email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hour

    // In a production backend, save token/expires in user model. We'll save it in twoFASecretTemp as placeholder or just simulate emailing it.
    user.twoFASecretTemp = `RESET_${resetToken}_EXP_${resetExpires}`;
    await user.save();

    await sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `Reset token: ${resetToken}. Expires in 1 hour.`,
      html: `<p>You requested a password reset. Use this token: <strong>${resetToken}</strong></p>`
    });

    res.json({ msg: 'Password reset token has been sent to your email.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;
  try {
    const users = await User.findAll();
    let matchedUser = null;

    for (const u of users) {
      if (u.twoFASecretTemp && u.twoFASecretTemp.startsWith('RESET_')) {
        const parts = u.twoFASecretTemp.split('_');
        const savedToken = parts[1];
        const expires = parseInt(parts[3]);

        if (savedToken === token && expires > Date.now()) {
          matchedUser = u;
          break;
        }
      }
    }

    if (!matchedUser) {
      return res.status(400).json({ msg: 'Password reset token is invalid or has expired' });
    }

    matchedUser.password = newPassword;
    matchedUser.twoFASecretTemp = null;
    await matchedUser.save();

    await logActivity(matchedUser.id, 'Reset Password Success', req.ip);

    res.json({ msg: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
};
