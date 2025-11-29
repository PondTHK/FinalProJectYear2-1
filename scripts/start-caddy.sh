#!/bin/bash

# Script to start Caddy reverse proxy
# Make sure Caddy is installed: brew install caddy

CADDYFILE_PATH="$(dirname "$0")/../Caddyfile"

if [ ! -f "$CADDYFILE_PATH" ]; then
    echo "❌ Caddyfile not found at $CADDYFILE_PATH"
    exit 1
fi

echo "🚀 Starting Caddy reverse proxy..."
echo "📄 Using Caddyfile: $CADDYFILE_PATH"
echo ""

# Check if Caddy is installed
if ! command -v caddy &> /dev/null; then
    echo "❌ Caddy is not installed!"
    echo "📦 Install with: brew install caddy"
    echo "   Or download from: https://caddyserver.com/download"
    exit 1
fi

# Start Caddy
caddy run --config "$CADDYFILE_PATH"

