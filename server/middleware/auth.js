const crypto = require('crypto');

// Simple token storage (in production, use Redis or database)
const validTokens = new Map();

// Generate token
function generateToken(username) {
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.set(token, { username, createdAt: Date.now() });
  return token;
}

// Validate token
function validateToken(token) {
  const tokenData = validTokens.get(token);
  if (!tokenData) return null;

  // Check if token is expired (24 hours)
  const expirationTime = 24 * 60 * 60 * 1000;
  if (Date.now() - tokenData.createdAt > expirationTime) {
    validTokens.delete(token);
    return null;
  }

  return tokenData;
}

// Remove token
function removeToken(token) {
  validTokens.delete(token);
}

// Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Iltimos, login qiling'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const tokenData = validateToken(token);

  if (!tokenData) {
    return res.status(401).json({
      success: false,
      message: 'Token yaroqsiz yoki muddati tugagan'
    });
  }

  req.user = { username: tokenData.username, role: 'admin' };
  next();
};

module.exports = authMiddleware;
module.exports.generateToken = generateToken;
module.exports.validateToken = validateToken;
module.exports.removeToken = removeToken;