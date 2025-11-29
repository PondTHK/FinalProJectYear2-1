#!/usr/bin/env node

/**
 * Development script to run both user and admin apps concurrently
 * Uses concurrently package to manage multiple processes
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const adminDir = path.resolve(rootDir, 'free-nextjs-admin-dashboard-main');

console.log('🚀 Starting Smart Persona development servers...\n');

// Start user app (port 3000)
const userApp = spawn('npm', ['run', 'dev', '--', '-p', '3000'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

// Start admin app (port 3001)
const adminApp = spawn('npm', ['run', 'dev', '--', '-p', '3001'], {
  cwd: adminDir,
  stdio: 'inherit',
  shell: true,
});

// Handle cleanup
const cleanup = () => {
  console.log('\n🛑 Stopping servers...');
  userApp.kill();
  adminApp.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Log URLs
setTimeout(() => {
  console.log('\n✅ Development servers started!');
  console.log('📱 User App: http://user.smartpersona.local');
  console.log('👨‍💼 Admin App: http://admin.smartpersona.local');
  console.log('\nPress Ctrl+C to stop all servers\n');
}, 3000);

