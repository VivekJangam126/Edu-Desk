# Deployment Guide: Vercel + Render

## 🎯 Overview
- **Frontend (React)**: Deployed on Vercel
- **Backend (Node.js API)**: Deployed on Render
- **Database**: Firestore (cloud) with SQLite fallback
- **File Storage**: Cloudflare R2

## 🚀 Step-by-Step Deployment

### 1. Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy Backend to Render

1. **Create Render Account**: Go to [render.com](https://render.com)
2. **Create Web Service**: 
   - Connect your GitHub repository
   - Choose "Web Service"
   - Root Directory: Leave empty (will use server folder)
   
3. **Configure Build Settings**:
   ```
   Build Command: cd server && npm install
   Start Command: cd server && npm start
   Environment: Node
   ```

4. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-super-secure-jwt-secret-here
   DB_PATH=./database.db
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760
   CORS_ORIGINS=https://your-app.vercel.app
   
   # Firebase (copy from your server/.env)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   
   # Cloudflare R2 (copy from your server/.env)
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   R2_BUCKET_NAME=your-bucket-name
   ```

5. **Deploy**: Click "Create Web Service"

### 3. Deploy Frontend to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables** in Vercel Dashboard:
   ```
   REACT_APP_API_URL=https://your-backend-app.onrender.com
   ```

### 4. Update CORS Settings

After both deployments, update the CORS_ORIGINS in Render:
```
CORS_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com
```

## 🔧 Configuration Files Explained

### vercel.json
- Configures Vercel to build and serve the React app
- Sets up routing for SPA (Single Page Application)

### render.yaml
- Optional: Infrastructure as Code for Render
- Defines service configuration and environment variables

## 🌐 Custom Domain Setup

### Vercel (Frontend)
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Render (Backend)
1. Go to Render Dashboard → Your Service → Settings
2. Add custom domain under "Custom Domains"
3. Update CORS_ORIGINS environment variable

## 🔒 Security Checklist

- [ ] Rotate all API keys and secrets
- [ ] Use strong JWT_SECRET (generate with: `openssl rand -hex 64`)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS (automatic on both platforms)
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy

## 📊 Monitoring & Maintenance

### Render Monitoring
- Built-in metrics and logs
- Set up alerts for downtime
- Monitor resource usage

### Vercel Analytics
- Enable Vercel Analytics for frontend performance
- Monitor Core Web Vitals
- Track user engagement

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check CORS_ORIGINS environment variable
   - Ensure frontend URL is correctly set

2. **Database Connection Issues**:
   - Verify Firebase credentials
   - Check Firestore rules
   - Ensure SQLite fallback works

3. **File Upload Issues**:
   - Verify R2 credentials
   - Check bucket permissions
   - Monitor storage usage

4. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Review build logs for specific errors

### Logs Access
- **Render**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Project → Functions → View Logs

## 💰 Cost Estimation

### Render (Backend)
- **Starter Plan**: $7/month (512MB RAM, 0.1 CPU)
- **Standard Plan**: $25/month (2GB RAM, 1 CPU) - Recommended

### Vercel (Frontend)
- **Hobby Plan**: Free (100GB bandwidth)
- **Pro Plan**: $20/month (1TB bandwidth) - For production

### Total Monthly Cost: ~$27-45/month

## 🔄 CI/CD Setup (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: cd client && npm install && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review platform documentation (Vercel/Render)
3. Check GitHub issues for similar problems
4. Contact platform support if needed