const axios = require('axios');

const testLogin = async () => {
  try {
    const res = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    console.log('Login successful:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
  }
};

testLogin();
