const db = require('../config/database');
require('dotenv').config();

async function initDatabase() {
  try {
    console.log('🔧 Database yaratilmoqda...\n');

    // Create blogs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('interview', 'article', 'fact')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ blogs jadvali yaratildi');

    // Create blog_translations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS blog_translations (
        id SERIAL PRIMARY KEY,
        blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
        language VARCHAR(10) NOT NULL CHECK (language IN ('ru', 'en', 'es', 'fr')),
        title TEXT NOT NULL,
        date VARCHAR(50) NOT NULL,
        source TEXT,
        content JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blog_id, language)
      );
    `);
    console.log('✓ blog_translations jadvali yaratildi');

    // Create blog_images table
    await db.query(`
      CREATE TABLE IF NOT EXISTS blog_images (
        id SERIAL PRIMARY KEY,
        blog_id INTEGER NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
        language VARCHAR(10) NOT NULL CHECK (language IN ('ru', 'en', 'es', 'fr')),
        image_url TEXT NOT NULL,
        image_order INTEGER NOT NULL,
        is_array BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blog_id, language, image_order)
      );
    `);
    console.log('✓ blog_images jadvali yaratildi');

    // Create indexes
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_translations_blog_id 
      ON blog_translations(blog_id);
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_translations_language 
      ON blog_translations(language);
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_images_blog_id 
      ON blog_images(blog_id);
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_type 
      ON blogs(type);
    `);
    
    console.log('✓ Indexlar yaratildi');

    // Create trigger for updated_at
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await db.query(`
      DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
      CREATE TRIGGER update_blogs_updated_at 
      BEFORE UPDATE ON blogs 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await db.query(`
      DROP TRIGGER IF EXISTS update_blog_translations_updated_at ON blog_translations;
      CREATE TRIGGER update_blog_translations_updated_at 
      BEFORE UPDATE ON blog_translations 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✓ Triggerlar yaratildi');

    console.log('\n✅ Database muvaffaqiyatli yaratildi!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database yaratishda xatolik:', error);
    process.exit(1);
  }
}

initDatabase();
