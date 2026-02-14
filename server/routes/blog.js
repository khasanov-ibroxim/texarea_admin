const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const LANGUAGES = ['ru', 'en', 'es', 'fr'];

// GET all blogs (admin) - barcha tillar uchun
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    // Admin va moderator ko'ra oladi
    const result = await db.query(`
      SELECT 
        b.id,
        b.type,
        b.created_at,
        b.updated_at,
        json_object_agg(
          bt.language,
          json_build_object(
            'title', bt.title,
            'date', bt.date,
            'source', bt.source,
            'content', bt.content
          )
        ) FILTER (WHERE bt.language IS NOT NULL) as translations
      FROM blogs b
      LEFT JOIN blog_translations bt ON b.id = bt.blog_id
      GROUP BY b.id, b.type, b.created_at, b.updated_at
      ORDER BY b.id DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Bloglarni olishda xatolik'
    });
  }
});

// GET all blogs for a specific language (public)
router.get('/:lang', async (req, res) => {
  try {
    const { lang } = req.params;

    if (!LANGUAGES.includes(lang)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri til'
      });
    }

    const result = await db.query(`
      SELECT 
        b.id,
        b.type,
        bt.title,
        bt.date,
        bt.source,
        bt.content,
        b.created_at,
        b.updated_at
      FROM blogs b
      LEFT JOIN blog_translations bt ON b.id = bt.blog_id AND bt.language = $1
      ORDER BY b.id DESC
    `, [lang]);

    // Get images for each blog
    const blogsWithImages = await Promise.all(
        result.rows.map(async (blog) => {
          const imagesResult = await db.query(`
          SELECT image_url, image_order, is_array
          FROM blog_images
          WHERE blog_id = $1 AND language = $2
          ORDER BY image_order
        `, [blog.id, lang]);

          return {
            ...blog,
            images: imagesResult.rows.map(img => img.image_url)
          };
        })
    );

    res.json({
      success: true,
      data: {
        hero: {
          header: lang === 'ru' ? 'Все лучшее из TEX AREA' : 'All the best from TEX AREA'
        },
        side: {
          search: lang === 'ru' ? 'Поиск' : 'Search',
          newsletter: {
            title: lang === 'ru' ? 'Подпишитесь на нашу рассылку' : 'Subscribe to our newsletter',
            text: lang === 'ru' ? 'Никакого спама, уведомления только о новых товарах, обновлениях.' : 'No spam, notifications only about new products, updates.',
            placeholder: lang === 'ru' ? 'Введите свой адрес электронной почты.' : 'Enter your email address.'
          },
          'more-news': lang === 'ru' ? 'Новости' : 'News',
          categories: {
            title: lang === 'ru' ? 'Категория' : 'Category',
            type: {
              all: lang === 'ru' ? 'Все' : 'All',
              interview: lang === 'ru' ? 'Интервью' : 'Interview',
              article: lang === 'ru' ? 'Статьи' : 'Articles',
              fact: lang === 'ru' ? 'Факты' : 'Facts'
            }
          },
          tags: {
            title: lang === 'ru' ? 'Тэги' : 'Tags',
            list: ['Textile', 'Fashion', 'Designer', 'Uzbekistan', 'Model', 'Yarn', 'Cotton', 'Cluster', 'Brand', 'Outfits', 'Products', 'Export', 'Certificate']
          }
        },
        'latest-news': lang === 'ru' ? 'Свежие записи' : 'Latest posts',
        source: lang === 'ru' ? 'Источник' : 'Source',
        list: blogsWithImages
      }
    });

  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Bloglarni olishda xatolik',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET single blog by ID (public)
router.get('/:lang/:id', async (req, res) => {
  try {
    const { lang, id } = req.params;

    if (!LANGUAGES.includes(lang)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri til'
      });
    }

    const result = await db.query(`
      SELECT 
        b.id,
        b.type,
        bt.title,
        bt.date,
        bt.source,
        bt.content,
        b.created_at,
        b.updated_at
      FROM blogs b
      LEFT JOIN blog_translations bt ON b.id = bt.blog_id AND bt.language = $1
      WHERE b.id = $2
    `, [lang, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog topilmadi'
      });
    }

    const blog = result.rows[0];

    // Get images
    const imagesResult = await db.query(`
      SELECT image_url, image_order, is_array
      FROM blog_images
      WHERE blog_id = $1 AND language = $2
      ORDER BY image_order
    `, [id, lang]);

    res.json({
      success: true,
      data: {
        ...blog,
        images: imagesResult.rows.map(img => img.image_url)
      }
    });

  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Blogni olishda xatolik'
    });
  }
});

// CREATE new blog - admin va moderator
router.post('/', authMiddleware, async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { blogs, type, images } = req.body;

    if (!blogs || typeof blogs !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Blogs ma\'lumoti noto\'g\'ri'
      });
    }

    if (!type || !['interview', 'article', 'fact'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri type'
      });
    }

    for (const lang of LANGUAGES) {
      if (!blogs[lang]) {
        return res.status(400).json({
          success: false,
          message: `${lang} tili uchun ma'lumot yo'q`
        });
      }
    }

    await client.query('BEGIN');

    // Create blog
    const blogResult = await client.query(
        'INSERT INTO blogs (type) VALUES ($1) RETURNING id',
        [type]
    );
    const blogId = blogResult.rows[0].id;

    // Add translations for all languages
    for (const lang of LANGUAGES) {
      const { title, date, source, content } = blogs[lang];

      await client.query(
          `INSERT INTO blog_translations (blog_id, language, title, date, source, content)
         VALUES ($1, $2, $3, $4, $5, $6)`,
          [blogId, lang, title, date, source || null, JSON.stringify(content)]
      );
    }

    // Add images if provided
    if (images && typeof images === 'object') {
      for (const lang of LANGUAGES) {
        if (images[lang] && Array.isArray(images[lang])) {
          for (let i = 0; i < images[lang].length; i++) {
            await client.query(
                `INSERT INTO blog_images (blog_id, language, image_url, image_order, is_array)
               VALUES ($1, $2, $3, $4, $5)`,
                [blogId, lang, images[lang][i], i, false]
            );
          }
        }
      }
    }

    await client.query('COMMIT');

    console.log(`✅ Blog created by ${req.user.username} (${req.user.role})`);

    res.status(201).json({
      success: true,
      message: 'Blog muvaffaqiyatli yaratildi',
      blogId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Blog yaratishda xatolik',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// UPDATE blog - admin va moderator
router.put('/:id', authMiddleware, async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { id } = req.params;
    const { blogs, type, images } = req.body;

    if (!blogs || typeof blogs !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Blogs ma\'lumoti noto\'g\'ri'
      });
    }

    await client.query('BEGIN');

    // Update blog type if provided
    if (type && ['interview', 'article', 'fact'].includes(type)) {
      await client.query(
          'UPDATE blogs SET type = $1 WHERE id = $2',
          [type, id]
      );
    }

    // Update translations
    for (const lang of LANGUAGES) {
      if (!blogs[lang]) continue;

      const { title, date, source, content } = blogs[lang];

      await client.query(
          `INSERT INTO blog_translations (blog_id, language, title, date, source, content)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (blog_id, language) 
         DO UPDATE SET 
           title = EXCLUDED.title,
           date = EXCLUDED.date,
           source = EXCLUDED.source,
           content = EXCLUDED.content,
           updated_at = CURRENT_TIMESTAMP`,
          [id, lang, title, date, source || null, JSON.stringify(content)]
      );
    }

    // Update images if provided
    if (images && typeof images === 'object') {
      // Delete old images
      await client.query('DELETE FROM blog_images WHERE blog_id = $1', [id]);

      // Add new images
      for (const lang of LANGUAGES) {
        if (images[lang] && Array.isArray(images[lang])) {
          for (let i = 0; i < images[lang].length; i++) {
            await client.query(
                `INSERT INTO blog_images (blog_id, language, image_url, image_order, is_array)
               VALUES ($1, $2, $3, $4, $5)`,
                [id, lang, images[lang][i], i, false]
            );
          }
        }
      }
    }

    await client.query('COMMIT');

    console.log(`✅ Blog updated by ${req.user.username} (${req.user.role})`);

    res.json({
      success: true,
      message: 'Blog muvaffaqiyatli yangilandi'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Blogni yangilashda xatolik',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// DELETE blog - admin va moderator
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
        'DELETE FROM blogs WHERE id = $1 RETURNING id',
        [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog topilmadi'
      });
    }

    console.log(`✅ Blog deleted by ${req.user.username} (${req.user.role})`);

    res.json({
      success: true,
      message: 'Blog muvaffaqiyatli o\'chirildi'
    });

  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Blogni o\'chirishda xatolik'
    });
  }
});

module.exports = router;