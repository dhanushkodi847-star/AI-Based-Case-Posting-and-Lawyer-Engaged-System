const express = require('express');
const router = express.Router();
const {
  getStats, getAnalytics, getFraudIntelligence, getCases, deleteCase, getPayments,
  getSystemConfig, updateSystemConfig,
  getUsers, getPendingLawyers, verifyLawyer, toggleUserStatus,
  getPendingCases, approveCase, getFlaggedActivities, toggleFlagStatus,
  getGlobalConversations, getGlobalMessages
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/analytics', protect, admin, getAnalytics);
router.get('/fraud-detection', protect, admin, getFraudIntelligence);
router.get('/cases', protect, admin, getCases);
router.delete('/cases/:id', protect, admin, deleteCase);
router.get('/payments', protect, admin, getPayments);
router.get('/system-config', protect, admin, getSystemConfig);
router.put('/system-config', protect, admin, updateSystemConfig);

router.get('/stats', protect, admin, getStats);
router.get('/users', protect, admin, getUsers);
router.get('/pending-lawyers', protect, admin, getPendingLawyers);
router.get('/pending-cases', protect, admin, getPendingCases);
router.get('/flagged-activities', protect, admin, getFlaggedActivities);
router.get('/conversations', protect, admin, getGlobalConversations);
router.get('/messages/:u1/:u2', protect, admin, getGlobalMessages);
router.put('/verify-lawyer/:id', protect, admin, verifyLawyer);
router.put('/toggle-user/:id', protect, admin, toggleUserStatus);
router.put('/approve-case/:id', protect, admin, approveCase);
router.put('/toggle-flag/:type/:id', protect, admin, toggleFlagStatus);

module.exports = router;
