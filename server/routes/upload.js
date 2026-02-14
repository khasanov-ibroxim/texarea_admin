const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Faqat admin rasm yuklash/o\'chirish mumkin'
    });
  }
  next();
};

// Configure multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari (JPEG, PNG, GIF, WEBP) qabul qilinadi'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

// Upload single image - ADMIN va MODERATOR (blog uchun kerak)
router.post('/single', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Rasm yuklanmadi'
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    console.log(`✅ Image uploaded by ${req.user.username} (${req.user.role})`);

    res.json({
      success: true,
      message: 'Rasm muvaffaqiyatli yuklandi',
      data: {
        filename: req.file.filename,
        url: imageUrl,
        path: req.file.path,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Rasm yuklashda xatolik'
    });
  }
});

// Upload multiple images - ADMIN va MODERATOR
router.post('/multiple', authMiddleware, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rasmlar yuklanmadi'
      });
    }

    const images = req.files.map(file => ({
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      path: file.path,
      size: file.size
    }));

    console.log(`✅ ${images.length} images uploaded by ${req.user.username} (${req.user.role})`);

    res.json({
      success: true,
      message: `${images.length} ta rasm muvaffaqiyatli yuklandi`,
      data: images
    });

  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({
      success: false,
      message: 'Rasmlarni yuklashda xatolik'
    });
  }
});

// Delete image - FAQAT ADMIN
router.delete('/:filename', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);

      console.log(`✅ Image deleted by ${req.user.username} (admin)`);

      res.json({
        success: true,
        message: 'Rasm muvaffaqiyatli o\'chirildi'
      });

    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Rasm topilmadi'
      });
    }

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Rasmni o\'chirishda xatolik'
    });
  }
});

// Get all uploaded images - FAQAT ADMIN
router.get('/list', authMiddleware, adminOnly, async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads');

    try {
      const files = await fs.readdir(uploadDir);
      const imageStats = await Promise.all(
          files
              .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
              .map(async file => {
                const stats = await fs.stat(path.join(uploadDir, file));
                return {
                  filename: file,
                  url: `/uploads/${file}`,
                  size: stats.size,
                  createdAt: stats.birthtime
                };
              })
      );

      imageStats.sort((a, b) => b.createdAt - a.createdAt);

      res.json({
        success: true,
        data: imageStats
      });

    } catch (error) {
      return res.json({
        success: true,
        data: [],
        message: 'Upload papkasi bo\'sh'
      });
    }

  } catch (error) {
    console.error('List images error:', error);
    res.status(500).json({
      success: false,
      message: 'Rasmlar ro\'yxatini olishda xatolik'
    });
  }
});

// Error handling
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fayl hajmi 10MB dan oshmasligi kerak'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Maksimal 10 ta rasm yuklash mumkin'
      });
    }
  }

  res.status(400).json({
    success: false,
    message: error.message || 'Fayl yuklashda xatolik'
  });
});

module.exports = router;