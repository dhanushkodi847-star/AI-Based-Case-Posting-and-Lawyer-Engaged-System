const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const reset = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (admin) {
      admin.password = 'admin123';
      await admin.save();
      console.log('Admin password explicitly set to: admin123 (Properly hashed)');
      console.log('Email to use:', admin.email);
    } else {
      console.log('Admin user not found!');
    }
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

reset();
