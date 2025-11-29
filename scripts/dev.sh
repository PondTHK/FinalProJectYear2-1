#!/bin/bash

# Development script to run both user and admin apps with subdomain routing
# Make sure Caddy is installed and running

echo "🚀 Starting Smart Persona development servers..."

# Kill any existing processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start user app (port 3000)
echo "📱 Starting User App on port 3000..."
cd "$(dirname "$0")/.."
npm run dev:user &
USER_PID=$!

# Start admin app (port 3001)
echo "👨‍💼 Starting Admin App on port 3001..."
cd free-nextjs-admin-dashboard-main
npm run dev &
ADMIN_PID=$!

# Wait for both to be ready
echo "⏳ Waiting for servers to start..."
sleep 5

echo ""
echo "✅ Development servers started!"
echo "📱 User App: http://user.smartpersona.local"
echo "👨‍💼 Admin App: http://admin.smartpersona.local"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $USER_PID $ADMIN_PID 2>/dev/null; exit" INT TERM
wait

