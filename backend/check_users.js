const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'email role name');
    fs.writeFileSync('user_list.json', JSON.stringify(users, null, 2));
    console.log('User list written to user_list.json');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
