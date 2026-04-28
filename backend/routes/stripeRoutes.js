const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createStripePaymentIntent } = require('../controllers/paymentController');

router.use(protect);
router.post('/create-payment-intent', createStripePaymentIntent);

module.exports = router;
