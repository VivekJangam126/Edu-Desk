#!/bin/bash

echo "🔧 Updating Vercel Environment Variables..."

# Replace with your actual Render backend URL
BACKEND_URL="https://edu-desk-api-latest.onrender.com"

echo "Setting REACT_APP_API_URL to: $BACKEND_URL"

# Update Vercel environment variable
vercel env add REACT_APP_API_URL production

echo "✅ Environment variable updated!"
echo "🚀 Redeploying to apply changes..."

# Redeploy to apply the new environment variable
vercel --prod

echo "✅ Deployment complete!"