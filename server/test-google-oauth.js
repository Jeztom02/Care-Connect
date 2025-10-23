// Test script to verify Google OAuth configuration
require('dotenv').config();

console.log('🔍 Google OAuth Configuration Test');
console.log('=====================================');

// Check environment variables
const checks = [
  {
    name: 'GOOGLE_CLIENT_ID',
    value: process.env.GOOGLE_CLIENT_ID,
    required: true
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    value: process.env.GOOGLE_CLIENT_SECRET,
    required: true
  },
  {
    name: 'GOOGLE_CALLBACK_URL',
    value: process.env.GOOGLE_CALLBACK_URL,
    required: true
  },
  {
    name: 'JWT_SECRET',
    value: process.env.JWT_SECRET,
    required: true
  },
  {
    name: 'SESSION_SECRET',
    value: process.env.SESSION_SECRET,
    required: true
  },
  {
    name: 'MONGODB_URI',
    value: process.env.MONGODB_URI,
    required: true
  },
  {
    name: 'ORIGIN',
    value: process.env.ORIGIN,
    required: true
  }
];

let allPassed = true;

checks.forEach(check => {
  const status = check.value ? '✅' : '❌';
  const value = check.value ? 'Set' : 'Missing';
  
  if (check.required && !check.value) {
    allPassed = false;
  }
  
  console.log(`${status} ${check.name}: ${value}`);
});

console.log('\n📋 Configuration Summary:');
console.log('========================');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Google OAuth: Configured');
  console.log(`   Client ID: ${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
  console.log(`   Callback URL: ${process.env.GOOGLE_CALLBACK_URL}`);
} else {
  console.log('❌ Google OAuth: Not configured');
  console.log('   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
}

console.log(`\n🌐 Server Configuration:`);
console.log(`   Backend URL: http://localhost:${process.env.PORT || 3001}`);
console.log(`   Frontend URL: ${process.env.ORIGIN || 'http://localhost:8080'}`);
console.log(`   Database: ${process.env.MONGODB_URI || 'Not set'}`);

console.log('\n🚀 Next Steps:');
if (allPassed) {
  console.log('✅ All configuration looks good!');
  console.log('1. Start the backend: npm run dev');
  console.log('2. Start the frontend: npm run dev (in project root)');
  console.log('3. Test Google sign-in at http://localhost:8080/login');
} else {
  console.log('❌ Configuration incomplete. Please:');
  console.log('1. Create server/.env file with required variables');
  console.log('2. Set up Google OAuth credentials in Google Cloud Console');
  console.log('3. Run this test again');
}

console.log('\n📖 For detailed setup instructions, see:');
console.log('   - GOOGLE_OAUTH_SETUP.md');
console.log('   - GOOGLE_OAUTH_TROUBLESHOOTING.md');

