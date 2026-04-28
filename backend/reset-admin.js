const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const path = require('path');

// Load env vars from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
      console.log(`Found existing admin: ${admin.email}`);
      admin.password = 'admin123';
      await admin.save();
      console.log('Admin password reset to: admin123');
    } else {
      console.log('No admin found. Creating a new one...');
      const newAdmin = await User.create({
        name: 'System Admin',
        email: 'admin@gmail.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log(`New admin created: admin@gmail.com / admin123`);
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetAdmin();
