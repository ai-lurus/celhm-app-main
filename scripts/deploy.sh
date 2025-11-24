#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the project root."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Run tests
echo "🧪 Running tests..."
pnpm test

# Build all packages
echo "🔨 Building packages..."
pnpm build

# Deploy to Vercel (if vercel CLI is installed)
if command -v vercel &> /dev/null; then
  echo "🌐 Deploying to Vercel..."
  vercel --prod
else
  echo "⚠️  Vercel CLI not found. Please install it with: npm i -g vercel"
  echo "📋 Manual deployment steps:"
  echo "   1. Push to main branch"
  echo "   2. Vercel will automatically deploy"
fi

echo "✅ Deployment completed!"

