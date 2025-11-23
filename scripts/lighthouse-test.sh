#!/bin/bash

# Lighthouse Performance Testing Script
# Usage: ./scripts/lighthouse-test.sh

set -e

echo "🚀 Building production bundle..."
npm run build

echo ""
echo "📊 Starting preview server..."
npm run preview &
PREVIEW_PID=$!

# Wait for server to start
sleep 5

echo ""
echo "🔍 Running Lighthouse tests..."

# Mobile test
echo "📱 Testing Mobile Performance..."
lighthouse http://localhost:4173 \
  --preset=mobile \
  --output=html \
  --output=json \
  --output-path=./lighthouse-mobile.html \
  --quiet

# Desktop test
echo "🖥️  Testing Desktop Performance..."
lighthouse http://localhost:4173 \
  --preset=desktop \
  --output=html \
  --output=json \
  --output-path=./lighthouse-desktop.html \
  --quiet

# Kill preview server
kill $PREVIEW_PID

echo ""
echo "✅ Lighthouse tests complete!"
echo ""
echo "📄 Reports saved:"
echo "   - Mobile:  lighthouse-mobile.html"
echo "   - Desktop: lighthouse-desktop.html"
echo ""
echo "📊 Open reports with:"
echo "   open lighthouse-mobile.html (Mac)"
echo "   start lighthouse-mobile.html (Windows)"
echo "   xdg-open lighthouse-mobile.html (Linux)"
