const express = require('express');
const authMiddleware = require('../middleware/auth');

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

    // Set session
    req.session.user = {
      username,
      role: 'admin'
    };

    console.log('✅ Login successful');
    console.log('📝 Session created:', req.sessionID);
    console.log('👤 User:', req.session.user);

    // MUHIM: session.save() ishlatish - cookie set bo'lishini ta'minlaydi
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.status(500).json({
          success: false,
          message: 'Session saqlashda xatolik'
        });
      }

      console.log('💾 Session saved successfully');
      console.log('🍪 Cookie should be set: connect.sid');

      res.json({
        success: true,
        message: 'Login muvaffaqiyatli',
        user: {
          username,
          role: 'admin'
        }
      });
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
router.get('/check', (req, res) => {
  console.log('\n🔍 Auth check');
  console.log('Session ID:', req.sessionID);
  console.log('Session user:', req.session?.user);

  if (req.session && req.session.user) {
    console.log('✅ Authenticated');
    res.json({
      success: true,
      user: req.session.user
    });
  } else {
    console.log('❌ Not authenticated');
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  console.log('\n👋 Logout request');
  console.log('Session ID:', req.sessionID);

  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Logout xatosi'
      });
    }

    console.log('✅ Session destroyed');
    res.clearCookie('connect.sid');
    console.log('🍪 Cookie cleared');

    res.json({
      success: true,
      message: 'Logout muvaffaqiyatli'
    });
  });
});

module.exports = router;