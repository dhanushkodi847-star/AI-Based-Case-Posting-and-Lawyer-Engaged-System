const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const resetTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'testlawyer@gmail.com';
    const user = await User.findOne({ email });
    
    if (user) {
      user.password = 'password123';
      await user.save();
      console.log(`Password for ${email} has been reset to: password123`);
    } else {
      console.log(`User ${email} not found. Creating...`);
      await User.create({
        name: 'Test Lawyer',
        email: email,
        password: 'password123',
        role: 'lawyer',
        isVerified: true
      });
      console.log(`User ${email} created with password: password123`);
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetTestUser();
