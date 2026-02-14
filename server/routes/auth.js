const express = require('express');
const authMiddleware = require('../middleware/auth');
const { generateToken, validateToken, removeToken } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('\n🔐 Login attempt:', { username });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username va password majburiy'
      });
    }

    const correctUsername = process.env.ADMIN_USERNAME || 'admin';
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== correctUsername || password !== correctPassword) {
      console.log('❌ Invalid credentials');
      return res.status(401).json({
        success: false,
        message: 'Noto\'g\'ri username yoki password'
      });
    }

    // Generate token
    const token = generateToken(username);

    console.log('✅ Login successful');
    console.log('🎫 Token generated');

    res.json({
      success: true,
      message: 'Login muvaffaqiyatli',
      token,
      user: {
        username,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login jarayonida xatolik'
    });
  }
});

// Check auth
router.get('/check', authMiddleware, (req, res) => {
  console.log('\n🔍 Auth check');
  console.log('User:', req.user);

  res.json({
    success: true,
    user: req.user
  });
});

// Logout
router.post('/logout', (req, res) => {
  console.log('\n👋 Logout request');

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    removeToken(token);
    console.log('✅ Token removed');
  }

  res.json({
    success: true,
    message: 'Logout muvaffaqiyatli'
  });
});

module.exports = router;