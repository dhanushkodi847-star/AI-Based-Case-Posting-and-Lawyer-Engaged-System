const express = require('express');
const router = express.Router();
const {
  sendMessage, getConversation, getConversations, getUnreadCount, updateMessage, deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('file'), sendMessage);
router.get('/', protect, getConversations);
router.get('/unread/count', protect, getUnreadCount);
router.get('/:userId', protect, getConversation);
router.put('/:id', protect, updateMessage);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
