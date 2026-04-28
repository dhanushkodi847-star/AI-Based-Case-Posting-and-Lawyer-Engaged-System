const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a case title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a case description'],
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  category: {
    type: String,
    enum: [
      'Criminal Law', 'Civil Law', 'Family Law', 'Corporate Law',
      'Property Law', 'Labor Law', 'Constitutional Law', 'Tax Law',
      'Consumer Law', 'Cyber Law', 'Immigration Law', 'Environmental Law', 'Other'
    ],
    default: 'Other'
  },
  aiLabels: [{
    label: {
      type: String
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  status: {
    type: String,
    enum: ['open', 'pending_approval', 'assigned', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedLawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  interestedLawyers: [{
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  courtDates: [{
    title: String,
    date: Date,
    description: String,
    isNotified: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Index for search
caseSchema.index({ title: 'text', description: 'text' });
caseSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Case', caseSchema);
