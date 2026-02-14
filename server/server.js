const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS MIDDLEWARE
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`\n${req.method} ${req.path}`);
  console.log('Authorization:', req.headers.authorization);
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/database');
    await db.query('SELECT 1');

    res.json({
      status: 'OK',
      message: 'Server va database ishlayapti',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database bilan bog\'lanishda xatolik',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Server xatosi yuz berdi',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Yo\'nalish topilmadi'
  });
});

// Initialize uploads directory
async function initializeDirectories() {
  const uploadDir = path.join(__dirname, 'uploads');

  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('✓ uploads papkasi yaratildi');
  }
}

// Start server
async function startServer() {
  try {
    await initializeDirectories();

    // Test database connection
    const db = require('./config/database');
    await db.query('SELECT 1');
    console.log('✓ Database bilan bog\'lanish muvaffaqiyatli\n');

    app.listen(PORT, () => {
      console.log(`┌─────────────────────────────────────────────┐`);
      console.log(`│  🚀 TexArea Blog Backend Server            │`);
      console.log(`└─────────────────────────────────────────────┘`);
      console.log(`📍 Server:   http://localhost:${PORT}`);
      console.log(`📍 API:      http://localhost:${PORT}/api`);
      console.log(`🖼️  Uploads:  http://localhost:${PORT}/uploads`);
      console.log(`❤️  Health:   http://localhost:${PORT}/api/health`);
      console.log(`┌─────────────────────────────────────────────┐`);
      console.log(`👤 Username:  ${process.env.ADMIN_USERNAME || 'admin'}`);
      console.log(`🔒 Password:  ${process.env.ADMIN_PASSWORD || 'admin123'}`);
      console.log(`└─────────────────────────────────────────────┘`);
      console.log(`🌐 Frontend:  http://localhost:3001`);
      console.log(`🔐 Auth:      Token-based (Bearer)`);
      console.log(`┌─────────────────────────────────────────────┐\n`);
    });
  } catch (error) {
    console.error('❌ Server xatosi:', error);
    console.error('\n⚠️  PostgreSQL ishga tushganligini tekshiring!');
    console.error('   Database: ' + (process.env.DB_NAME || 'texarea_blog'));
    console.error('   Host: ' + (process.env.DB_HOST || 'localhost'));
    console.error('   Port: ' + (process.env.DB_PORT || '5432'));
    process.exit(1);
  }
}

startServer();

module.exports = app;