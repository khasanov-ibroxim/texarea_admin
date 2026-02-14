// server/scripts/createUsersTable.js
const bcrypt = require('bcrypt');
const db = require('./config/database');
require('dotenv').config();

async function createUsersTable() {
    try {
        console.log('🔧 Users jadvali yaratilmoqda...\n');

        // Create users table
        await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'moderator')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✓ users jadvali yaratildi');

        // Check if admin user exists
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [process.env.ADMIN_USERNAME || 'admin']
        );

        if (result.rows.length === 0) {
            // Create default admin user
            const hashedPassword = await bcrypt.hash(
                process.env.ADMIN_PASSWORD || 'admin123',
                10
            );

            await db.query(
                'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
                [process.env.ADMIN_USERNAME || 'admin', hashedPassword, 'admin']
            );

            console.log('✓ Admin user yaratildi');
            console.log(`  Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
            console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
        } else {
            console.log('✓ Admin user allaqachon mavjud');
        }

        console.log('\n✅ Users jadvali muvaffaqiyatli yaratildi!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Xatolik:', error);
        process.exit(1);
    }
}

createUsersTable();