# Blog Backend Server

Node.js + Express + PostgreSQL + Session Auth

## Tezkor Ishga Tushirish

### 1. PostgreSQL o'rnating
```bash
# Ubuntu/Debian
sudo apt install postgresql
sudo systemctl start postgresql

# Database yarating
createdb texarea_blog
```

### 2. Dependencies
```bash
npm install
```

### 3. Database jadvallarini yarating
```bash
npm run init-db
```

### 4. Server ishga tushiring
```bash
npm run dev
```

Server: http://localhost:5000

## Login Ma'lumotlari

**Username**: admin  
**Password**: admin123

(.env faylida o'zgartirishingiz mumkin)

## API Endpoints

### Auth
- POST /api/auth/login
- GET /api/auth/check
- POST /api/auth/logout

### Blogs
- GET /api/blogs/:lang
- GET /api/blogs/:lang/:id
- POST /api/blogs (auth)
- PUT /api/blogs/:id (auth)
- DELETE /api/blogs/:id (auth)

### Upload
- POST /api/upload/single (auth)
- POST /api/upload/multiple (auth)
- GET /api/upload/list (auth)
- DELETE /api/upload/:filename (auth)

## Session Authentication

Session cookie orqali ishlaydi. Frontend `credentials: 'include'` bilan request yuborishi kerak.
