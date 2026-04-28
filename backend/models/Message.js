const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  content: {
    type: String,
    maxlength: [2000, 'Message cannot be more than 2000 characters']
  },
  fileUrl: {
    type: String
  },
  fileType: {
    type: String,
    enum: ['image', 'document', 'audio']
  },
  originalName: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ caseRef: 1 });

module.exports = mongoose.model('Message', messageSchema);
