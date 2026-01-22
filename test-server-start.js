// Simple test to verify server starts without syntax errors
const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_PATH = './test-database.db';
process.env.UPLOAD_DIR = './test-uploads';
process.env.CORS_ORIGINS = 'http://localhost:3000';

console.log('🧪 Testing server startup...');

try {
  // Try to require the server file
  const app = require('./server/index.js');
  console.log('✅ Server file loaded successfully');
  
  // Give it a moment to start
  setTimeout(() => {
    console.log('✅ Server started without errors');
    process.exit(0);
  }, 2000);
  
} catch (error) {
  console.error('❌ Server startup failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}