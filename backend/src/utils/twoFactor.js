const { authenticator } = require('otplib');

function generateSecret() {
  return authenticator.generateSecret();
}

function generateOtpauthUri(username, secret) {
  return authenticator.keyuri(username, 'TradingApp', secret);
}

function verifyToken(token, secret) {
  try {
    return authenticator.verify({ token, secret });
  } catch (err) {
    console.error('2FA Verification Error:', err.message);
    return false;
  }
}

module.exports = {
  generateSecret,
  generateOtpauthUri,
  verifyToken
};
