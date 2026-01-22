#!/bin/bash

echo "🚀 Deploying Edu-Desk to Vercel + Render..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Build the client
echo "🏗️  Building client..."
cd client
npm run build
cd ..

# Deploy to Vercel (frontend)
echo "🌐 Deploying frontend to Vercel..."
npx vercel --prod

# Instructions for Render deployment
echo ""
echo "🔧 Next steps for Render (backend) deployment:"
echo "1. Go to https://render.com and create a new Web Service"
echo "2. Connect your GitHub repository"
echo "3. Use these settings:"
echo "   - Build Command: cd server && npm install"
echo "   - Start Command: cd server && npm start"
echo "   - Environment: Node"
echo "4. Add environment variables from server/.env"
echo "5. Deploy!"
echo ""
echo "✅ Frontend deployed! Update REACT_APP_API_URL in Vercel dashboard with your Render URL"