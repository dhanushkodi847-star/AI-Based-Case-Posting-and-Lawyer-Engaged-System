const express = require('express');
const router = express.Router();
const { 
  createPayment, 
  verifyPayment, 
  getPaymentHistory,
  initiateCheckout,
  verifyAppointmentPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Razorpay Payment System (Cases)
router.post('/create-order', createPayment);
router.post('/verify', verifyPayment);

// Legacy Appointment System
router.post('/checkout', initiateCheckout);
router.post('/verify/:id', verifyAppointmentPayment);

// History
router.get('/history', getPaymentHistory);

module.exports = router;
