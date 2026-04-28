const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Send a message
// @route   POST /api/messages
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, caseRef } = req.body;

    if (!receiverId || (!content && !req.file)) {
      return res.status(400).json({ success: false, message: 'Receiver and content or file are required' });
    }

    // Check receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    let fileUrl = undefined;
    let fileType = undefined;
    let originalName = undefined;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      originalName = req.file.originalname;
      if (req.file.mimetype.startsWith('image/')) fileType = 'image';
      else if (req.file.mimetype.startsWith('audio/') || req.file.mimetype === 'video/webm') fileType = 'audio';
      else fileType = 'document';
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content: content || '',
      caseRef: caseRef || null,
      fileUrl,
      fileType,
      originalName
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar role')
      .populate('receiver', 'name email avatar role');

    // Emit via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId).emit('receiveMessage', populatedMessage);
      
      // Also create a Notification for the receiver
      try {
        const notification = await Notification.create({
          user: receiverId,
          type: 'message',
          title: 'New Message',
          message: `You have a new message from ${req.user.name}`,
          link: `/messages?lawyerId=${req.user._id}`
        });
        io.to(receiverId).emit('newNotification', notification);
      } catch (err) {
        console.error('Message notification failed:', err);
      }
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/:userId
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'name email avatar role')
      .populate('receiver', 'name email avatar role')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Handle Seen Receipts
    const unreadMessages = await Message.find({ sender: userId, receiver: req.user._id, read: false });
    
    if (unreadMessages.length > 0) {
      const readTimestamp = new Date();
      await Message.updateMany(
        { sender: userId, receiver: req.user._id, read: false },
        { read: true, readAt: readTimestamp }
      );

      const io = req.app.get('io');
      if (io) {
        io.to(userId).emit('messagesRead', { 
          from: req.user._id, 
          readAt: readTimestamp,
          messageIds: unreadMessages.map(m => m._id)
        });
      }
    }

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all conversations (inbox)
// @route   GET /api/messages
exports.getConversations = async (req, res) => {
  try {
    // Get all unique users the current user has chatted with
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiver', req.user._id] },
                  { $eq: ['$read', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageAt: -1 }
      }
    ]);

    // Populate user info
    const populatedConversations = await User.populate(messages, {
      path: '_id',
      select: 'name email avatar role specializations'
    });

    const conversations = populatedConversations.map(conv => ({
      user: conv._id,
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: conv.unreadCount
    }));

    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update (Edit) a message
// @route   PUT /api/messages/:id
exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
    }

    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required for editing' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar role')
      .populate('receiver', 'name email avatar role');

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(message.receiver.toString()).emit('messageEdited', populatedMessage);
      io.to(message.sender.toString()).emit('messageEdited', populatedMessage);
    }

    res.json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete (Unsend) a message
// @route   DELETE /api/messages/:id
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    const receiverId = message.receiver.toString();
    const messageId = message._id.toString();

    await message.deleteOne();

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId).emit('messageDeleted', { messageId, receiverId });
      io.to(req.user._id.toString()).emit('messageDeleted', { messageId, receiverId });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
