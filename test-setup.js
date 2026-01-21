const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Edu-Desk setup...\n');

// Check if all required directories exist
const requiredDirs = ['server', 'client', 'uploads'];
const requiredFiles = [
  'package.json',
  'server/package.json',
  'client/package.json',
  'server/index.js',
  'client/src/App.js',
  'README.md'
];

let allGood = true;

// Check directories
console.log('📁 Checking directories...');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ - Missing!`);
    allGood = false;
  }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
  console.log('✅ Created uploads/ directory');
}

console.log('\n📄 Checking files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    allGood = false;
  }
});

// Check node_modules
console.log('\n📦 Checking dependencies...');
if (fs.existsSync('server/node_modules')) {
  console.log('✅ Server dependencies installed');
} else {
  console.log('❌ Server dependencies not installed');
  allGood = false;
}

if (fs.existsSync('client/node_modules')) {
  console.log('✅ Client dependencies installed');
} else {
  console.log('❌ Client dependencies not installed');
  allGood = false;
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 Setup complete! Edu-Desk is ready to run.');
  console.log('\nTo start the application:');
  console.log('  npm run dev');
  console.log('\nOr use the batch files:');
  console.log('  start.bat');
  console.log('\nThe application will be available at:');
  console.log('  Frontend: http://localhost:3000');
  console.log('  Backend:  http://localhost:5000');
} else {
  console.log('❌ Setup incomplete. Please check the missing items above.');
}

console.log('\n📚 Documentation:');
console.log('  README.md - Getting started guide');
console.log('  DEPLOYMENT.md - Production deployment guide');
console.log('\n🔧 Configuration:');
console.log('  server/.env.example - Environment variables template');