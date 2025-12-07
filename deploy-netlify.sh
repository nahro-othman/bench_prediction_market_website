#!/bin/bash

# 🚀 Quick Netlify Deployment Script for Bench Prediction Market
# This script helps you deploy to Netlify via CLI

echo "🎯 Bench Prediction Market - Netlify Deployment"
echo "================================================"
echo ""

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null
then
    echo "❌ Netlify CLI not found!"
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
    echo "✅ Netlify CLI installed!"
    echo ""
fi

# Check if logged in to Netlify
echo "🔐 Checking Netlify authentication..."
if ! netlify status &> /dev/null
then
    echo "🔑 Please log in to Netlify..."
    netlify login
else
    echo "✅ Already logged in to Netlify"
fi
echo ""

# Test build locally first
echo "🔨 Testing build locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
else
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
echo ""
echo "Choose deployment type:"
echo "1) Draft deploy (for testing)"
echo "2) Production deploy"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "📝 Creating draft deploy..."
        netlify deploy
        ;;
    2)
        echo "🚀 Deploying to production..."
        netlify deploy --prod
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check your site is working correctly"
echo "2. Test MetaMask connection"
echo "3. Verify environment variables are set"
echo "4. Test placing a bet"
echo ""
echo "🎉 Your Bench prediction market is live!"




