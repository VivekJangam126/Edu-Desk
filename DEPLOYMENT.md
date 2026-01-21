# Deployment Guide

This guide covers deploying Edu-Desk to production environments.

## Prerequisites

- Node.js 16+ and npm
- A server with at least 1GB RAM
- Domain name (optional but recommended)

## Environment Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd edu-desk
```

2. **Install dependencies**
```bash
npm install
cd client && npm install
cd ../server && npm install
```

3. **Environment Configuration**
```bash
cd server
cp .env.example .env
```

Edit `.env` with production values:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secure-random-jwt-secret-key
DB_PATH=../database.db
UPLOAD_DIR=../uploads
MAX_FILE_SIZE=10485760
CORS_ORIGINS=https://yourdomain.com
```

## Production Build

1. **Build the client**
```bash
cd client
npm run build
```

2. **Serve static files from Express**
Add to `server/index.js` before routes:
```javascript
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}
```

## Deployment Options

### Option 1: Traditional VPS/Server

1. **Upload files to server**
2. **Install Node.js and npm**
3. **Install PM2 for process management**
```bash
npm install -g pm2
```

4. **Start the application**
```bash
cd server
pm2 start index.js --name "edu-desk"
pm2 startup
pm2 save
```

5. **Setup Nginx reverse proxy**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Heroku

1. **Create Heroku app**
```bash
heroku create your-app-name
```

2. **Add buildpack**
```bash
heroku buildpacks:add heroku/nodejs
```

3. **Set environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
```

4. **Create Procfile**
```
web: cd server && npm start
```

5. **Deploy**
```bash
git push heroku main
```

### Option 3: Docker

1. **Create Dockerfile**
```dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
```

2. **Build and run**
```bash
docker build -t edu-desk .
docker run -p 5000:5000 edu-desk
```

## Database Considerations

For production, consider upgrading from SQLite to PostgreSQL or MySQL:

1. **Install database driver**
```bash
npm install pg  # for PostgreSQL
# or
npm install mysql2  # for MySQL
```

2. **Update database configuration**
3. **Run migrations**

## File Storage

For production, consider cloud storage:

1. **AWS S3**
2. **Google Cloud Storage**
3. **Cloudinary**

Update the multer configuration to use cloud storage instead of local storage.

## Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Enable HTTPS with SSL certificate
- [ ] Set up proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up file upload validation
- [ ] Configure proper error handling
- [ ] Set up monitoring and logging
- [ ] Regular security updates

## Monitoring

Consider adding:
- Application monitoring (New Relic, DataDog)
- Error tracking (Sentry)
- Uptime monitoring
- Log aggregation

## Backup Strategy

1. **Database backups**
2. **File storage backups**
3. **Code repository backups**
4. **Regular backup testing**