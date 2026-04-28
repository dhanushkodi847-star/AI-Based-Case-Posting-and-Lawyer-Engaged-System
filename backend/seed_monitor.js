const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Case = require('./models/Case');
const Message = require('./models/Message');
const Appointment = require('./models/Appointment');

// Load env vars from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // 1. Create/Get Users
    let client = await User.findOne({ email: 'client_monitor@example.com' });
    if (!client) {
      client = await User.create({
        name: 'John Client',
        email: 'client_monitor@example.com',
        password: 'password123',
        role: 'client'
      });
    }

    let lawyer = await User.findOne({ email: 'lawyer_monitor@example.com' });
    if (!lawyer) {
      lawyer = await User.create({
        name: 'Sarah Lawyer',
        email: 'lawyer_monitor@example.com',
        password: 'password123',
        role: 'lawyer',
        isVerified: true,
        specializations: ['Property Law'],
        experience: 10
      });
    }

    // 2. Create a Case
    const newCase = await Case.create({
      title: 'Property Dispute in Mumbai',
      description: 'Need help with a boundary dispute with my neighbor. The property is located in Bandra.',
      category: 'Property Law',
      status: 'assigned',
      postedBy: client._id,
      assignedLawyer: lawyer._id,
      priority: 'high',
      location: 'Mumbai'
    });

    // 3. Create Messages
    await Message.create([
      { sender: client._id, receiver: lawyer._id, content: 'Hello Sarah, I need help with my property case.' },
      { sender: lawyer._id, receiver: client._id, content: "Hello John, I have reviewed your case. Let's discuss." },
      { sender: client._id, receiver: lawyer._id, content: 'Sure, when can we have a call?' }
    ]);

    // 4. Create an Appointment
    await Appointment.create({
      client: client._id,
      lawyer: lawyer._id,
      caseRef: newCase._id,
      title: 'Consultation for Property Case',
      description: 'Initial discussion on boundary dispute.',
      dateTime: new Date(Date.now() + 86400000), // Tomorrow
      status: 'confirmed'
    });

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
