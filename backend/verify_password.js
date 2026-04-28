const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'admin@gmail.com' }).select('+password');
    if (!user) {
      console.log('User not found');
      process.exit();
    }
    
    const isMatch = await user.matchPassword('admin123');
    console.log('Password "admin123" match:', isMatch);
    
    // Also try checking if it's plain text (just in case)
    console.log('Is it plain text "admin123"?', user.password === 'admin123');
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

verify();
