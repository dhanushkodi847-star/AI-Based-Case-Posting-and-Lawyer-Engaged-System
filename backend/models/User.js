const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['client', 'lawyer', 'admin'],
    default: 'client'
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  // Lawyer-specific fields
  specializations: [{
    type: String,
    enum: [
      'Criminal Law', 'Civil Law', 'Family Law', 'Corporate Law',
      'Property Law', 'Labor Law', 'Constitutional Law', 'Tax Law',
      'Consumer Law', 'Cyber Law', 'Immigration Law', 'Environmental Law'
    ]
  }],
  barCouncilId: {
    type: String,
    trim: true
  },
  experience: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  location: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    default: ''
  },
  // Reputation fields
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  // Appointment settings
  consultationFee: {
    type: Number,
    default: 0
  },
  availability: {
    days: [String], // e.g., ['Monday', 'Tuesday']
    startTime: String, // e.g., '09:00'
    endTime: String, // e.g., '17:00'
    slotDuration: {
      type: Number,
      default: 30 // minutes
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
