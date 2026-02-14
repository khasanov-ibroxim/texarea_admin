const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { generateToken, removeToken } = require('../middleware/auth');

const router = express.Router();

// Login - Database dan user tekshirish
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

    // Database dan user topish
    const result = await db.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'Noto\'g\'ri username yoki password'
      });
    }

    const user = result.rows[0];

    // Password tekshirish
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Noto\'g\'ri username yoki password'
      });
    }

    // Yangi token generatsiya qilish (har login da yangi token)
    const token = generateToken(username, user.role);

    console.log('✅ Login successful');
    console.log('🎫 New token generated');
    console.log('👤 Role:', user.role);

    res.json({
      success: true,
      message: 'Login muvaffaqiyatli',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
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

// Create new user (faqat admin)
router.post('/users', authMiddleware, async (req, res) => {
  try {
    // Faqat admin user yarata oladi
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Faqat admin user yarata oladi'
      });
    }

    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username va password majburiy'
      });
    }

    // Role faqat moderator yoki admin
    const userRole = role === 'admin' ? 'admin' : 'moderator';

    // Password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // User yaratish
    const result = await db.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
        [username, hashedPassword, userRole]
    );

    console.log('✅ New user created:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'User muvaffaqiyatli yaratildi',
      user: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Bu username allaqachon mavjud'
      });
    }

    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'User yaratishda xatolik'
    });
  }
});

// Get all users (faqat admin)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Faqat admin userlarni ko\'ra oladi'
      });
    }

    const result = await db.query(
        'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      users: result.rows
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Userlarni olishda xatolik'
    });
  }
});

// Delete user (faqat admin)
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Faqat admin user o\'chira oladi'
      });
    }

    const { id } = req.params;

    // O'zini o'chirish mumkin emas
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'O\'zingizni o\'chira olmaysiz'
      });
    }

    const result = await db.query(
        'DELETE FROM users WHERE id = $1 RETURNING username',
        [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User topilmadi'
      });
    }

    console.log('✅ User deleted:', result.rows[0].username);

    res.json({
      success: true,
      message: 'User muvaffaqiyatli o\'chirildi'
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'User o\'chirishda xatolik'
    });
  }
});

module.exports = router;