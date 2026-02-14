const crypto = require('crypto');

// Token storage - { token: { username, role, createdAt } }
const validTokens = new Map();

// Generate token - yangi login da yangi token
function generateToken(username, role) {
  const token = crypto.randomBytes(32).toString('hex');
  validTokens.set(token, {
    username,
    role,
    createdAt: Date.now()
  });
  return token;
}

// Validate token
function validateToken(token) {
  const tokenData = validTokens.get(token);
  if (!tokenData) return null;

  // Token hech qachon expire bo'lmaydi - faqat logout da o'chiriladi
  return tokenData;
}

// Remove token
function removeToken(token) {
  validTokens.delete(token);
}

// Auth middleware - barcha authenticated userlar uchun
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Iltimos, login qiling'
    });
  }

  const token = authHeader.substring(7);
  const tokenData = validateToken(token);

  if (!tokenData) {
    return res.status(401).json({
      success: false,
      message: 'Token yaroqsiz'
    });
  }

  req.user = {
    username: tokenData.username,
    role: tokenData.role
  };
  next();
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Faqat admin uchun'
    });
  }
  next();
};

module.exports = authMiddleware;
module.exports.generateToken = generateToken;
module.exports.validateToken = validateToken;
module.exports.removeToken = removeToken;
module.exports.adminOnly = adminOnly;