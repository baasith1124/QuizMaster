#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm ci --include=dev

echo "🏗️ Building React app..."
npx vite build

echo "✅ Build completed successfully!"
ls -la dist/