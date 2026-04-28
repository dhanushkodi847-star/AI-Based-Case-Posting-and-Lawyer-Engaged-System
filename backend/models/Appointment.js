const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Please add a title for the appointment'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dateTime: {
    type: Date,
    required: [true, 'Please specify the appointment date and time']
  },
  duration: {
    type: Number,
    default: 30 // minutes
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded', 'not_required'],
    default: 'unpaid'
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  meetingLink: {
    type: String, // Google Meet/Zoom link
    default: ''
  },
  location: {
    type: String, // For offline meetings
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for performance
appointmentSchema.index({ lawyer: 1, dateTime: 1 });
appointmentSchema.index({ client: 1, dateTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
