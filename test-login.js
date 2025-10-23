// Simple test script to verify login functionality
const API_BASE = 'http://localhost:3001';

async function testLogin() {
  console.log('Testing login functionality...\n');
  
  // Test 1: Register a new user
  console.log('1. Testing user registration...');
  try {
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'test123',
        role: 'patient'
      })
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful:', registerData);
    } else {
      const error = await registerResponse.text();
      console.log('❌ Registration failed:', error);
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
  }
  
  // Test 2: Login with the registered user
  console.log('\n2. Testing user login...');
  try {
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', { 
        hasToken: !!loginData.token, 
        user: loginData.user 
      });
    } else {
      const error = await loginResponse.text();
      console.log('❌ Login failed:', error);
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
  }
  
  // Test 3: Test with seeded user
  console.log('\n3. Testing login with seeded user...');
  try {
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@care.local',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Seeded user login successful:', { 
        hasToken: !!loginData.token, 
        user: loginData.user 
      });
    } else {
      const error = await loginResponse.text();
      console.log('❌ Seeded user login failed:', error);
    }
  } catch (error) {
    console.log('❌ Seeded user login error:', error.message);
  }
  
  // Test 4: Check server health
  console.log('\n4. Testing server health...');
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Server health check:', healthData);
    } else {
      console.log('❌ Server health check failed');
    }
  } catch (error) {
    console.log('❌ Server health check error:', error.message);
  }
}

// Run the test
testLogin().catch(console.error);










