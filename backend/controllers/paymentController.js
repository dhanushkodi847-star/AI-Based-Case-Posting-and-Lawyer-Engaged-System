const Payment = require('../models/Payment');
const Case = require('../models/Case');
const Transaction = require('../models/Transaction');
const Appointment = require('../models/Appointment');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// @desc    Create a pending payment
// @route   POST /api/payments/create-order
// @access  Private
exports.createPayment = async (req, res) => {
  try {
    const { caseId, userId, amount } = req.body;

    if (!caseId || !userId || !amount) {
      return res.status(400).json({ success: false, message: 'Please provide caseId, userId, and amount' });
    }

    // Create a new pending payment record natively
    const payment = await Payment.create({
      userId,
      caseId,
      amount,
      status: 'pending',
      razorpay_order_id: `mock_order_${Date.now()}` // Mock order ID
    });

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, status } = req.body;

    if (!paymentId || !status) {
      return res.status(400).json({ success: false, message: 'Please provide paymentId and status' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (status === 'success') {
      payment.status = 'success';
      payment.razorpay_payment_id = `mock_pay_${Date.now()}`;
      await payment.save();

      // Update case status to 'paid' 
      const relatedCase = await Case.findById(payment.caseId);
      if (relatedCase) {
        relatedCase.status = 'in-progress'; 
        await Case.findByIdAndUpdate(payment.caseId, {
          status: 'paid', 
          assignedLawyer: req.user._id 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified and case updated',
        data: payment
      });

    } else if (status === 'failed') {
      payment.status = 'failed';
      await payment.save();
      return res.status(200).json({
        success: true,
        message: 'Payment failed recorded',
        data: payment
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's payment history (Unified for both Cases and Appointments)
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
  try {
    // 1. Fetch legacy Appointment Transactions
    const transactions = await Transaction.find({
      $or: [{ client: req.user._id }, { lawyer: req.user._id }]
    }).populate('client lawyer', 'name email').sort('-createdAt').lean();

    // 2. Fetch new Case Payments
    const casePayments = await Payment.find({ userId: req.user._id })
      .populate('caseId', 'title category')
      .sort('-createdAt').lean();

    // 3. Map new Case Payments to look like the legacy transaction format for proper rendering in PaymentHistory.jsx
    const formattedCasePayments = casePayments.map(p => ({
      _id: p._id.toString(), // critical so PaymentProcess can find by ID
      amount: p.amount,
      createdAt: p.createdAt,
      description: `Case Fee: ${p.caseId ? p.caseId.title : 'Unknown Case'}`,
      transactionId: `CASE_PAY_${p._id.toString().substring(0, 8).toUpperCase()}`,
      status: p.status === 'success' ? 'completed' : p.status // map status to UI expected string
    }));

    // Combine and sort by date descending
    const allHistory = [...transactions, ...formattedCasePayments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: allHistory.length,
      data: allHistory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Stripe Payment Intent
// @route   POST /api/stripe/create-payment-intent
// @access  Private
exports.createStripePaymentIntent = async (req, res) => {
  try {
    const { amount, paymentId } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, error: 'Amount is required' });
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount value' });
    }

    const stripeAmount = Math.round(parsedAmount * 100); // convert INR to paisa
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: 'inr',
      metadata: {
        paymentId: paymentId || 'unknown',
        integration_check: 'accept_a_payment'
      }
    });

    return res.status(201).json({
      success: true,
      client_secret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe createPaymentIntent error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Stripe payment intent creation failed' });
  }
};

// --- LEGACY APPOINTMENT PAYMENT ROUTES ---

// @desc    Initiate a payment for an appointment
// @route   POST /api/payments/checkout
// @access  Private
exports.initiateCheckout = async (req, res) => {
  try {
    const { appointmentId, amount, description } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Create a pending transaction
    const transaction = await Transaction.create({
      client: req.user._id,
      lawyer: appointment.lawyer,
      appointment: appointmentId,
      amount,
      description: description || 'Consultation Fee',
      status: 'pending',
      transactionId: `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    });

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Verify/Complete an appointment payment via Razorpay
// @route   POST /api/payments/verify/:id
// @access  Private
exports.verifyAppointmentPayment = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    transaction.status = 'completed';
    await transaction.save();

    if (transaction.appointment) {
      await Appointment.findByIdAndUpdate(transaction.appointment, { 
        status: 'confirmed',
        paymentStatus: 'paid'
      });
    }

    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: transaction
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
