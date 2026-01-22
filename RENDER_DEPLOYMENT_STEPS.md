# 🚀 Render Deployment - Step by Step

## ✅ Pre-Deployment Checklist

1. **Server file fixed** ✅ - Syntax error resolved
2. **Environment variables prepared** - Copy from your server/.env
3. **Repository pushed to GitHub** - Make sure latest code is committed

## 🔧 Render Deployment Steps

### 1. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub account

### 2. Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select your repository

### 3. Configure Service Settings
```
Name: edu-desk-api
Environment: Node
Region: Oregon (or closest to your users)
Branch: main
Root Directory: (leave empty)
Build Command: cd server && npm install
Start Command: cd server && npm start
```

### 4. Add Environment Variables
**CRITICAL**: Add these environment variables in Render dashboard:

```bash
# Basic Configuration
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secure-jwt-secret-here
DB_PATH=./database.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS (update after Vercel deployment)
CORS_ORIGINS=https://your-app.vercel.app

# Firebase Configuration (copy from your server/.env)
FIREBASE_PROJECT_ID=edu-desk-9f97d
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[your-private-key]\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@edu-desk-9f97d.iam.gserviceaccount.com

# Cloudflare R2 Configuration (copy from your server/.env)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=user-images
```

### 5. Deploy
- Click "Create Web Service"
- Wait for deployment to complete (5-10 minutes)
- Check logs for any errors

### 6. Test Deployment
Once deployed, test these endpoints:
```bash
# Health check
curl https://your-app.onrender.com/api/health

# Colleges endpoint
curl https://your-app.onrender.com/api/academics/colleges
```

## 🔍 Troubleshooting Common Issues

### Build Failures
- **Node version**: Render uses Node 18 by default
- **Dependencies**: Make sure all dependencies are in package.json
- **Build command**: Ensure `cd server && npm install` works

### Runtime Errors
- **Environment variables**: Double-check all env vars are set
- **Database**: SQLite file will be created automatically
- **Uploads directory**: Will be created automatically

### CORS Issues
- **Update CORS_ORIGINS**: Add your Vercel domain
- **Multiple domains**: Separate with commas

## 📊 Monitoring Your Deployment

### Render Dashboard
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, response times
- **Events**: Deployment history

### Health Checks
- Render automatically monitors `/api/health`
- Will restart service if health check fails

## 💰 Pricing
- **Starter Plan**: $7/month (512MB RAM, 0.1 CPU)
- **Standard Plan**: $25/month (2GB RAM, 1 CPU)
- **Pro Plan**: $85/month (4GB RAM, 2 CPU)

**Recommendation**: Start with Starter plan, upgrade if needed.

## 🔄 Auto-Deploy Setup
- **Automatic**: Deploys on every push to main branch
- **Manual**: Can disable auto-deploy in settings
- **Branches**: Can deploy from different branches

## 📞 Getting Help
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)
- **Support**: Available for paid plans

## ✅ Success Indicators
- ✅ Build completes without errors
- ✅ Service starts successfully
- ✅ Health check returns 200 OK
- ✅ API endpoints respond correctly
- ✅ No error logs in dashboard

Your backend should now be live at: `https://your-app-name.onrender.com`