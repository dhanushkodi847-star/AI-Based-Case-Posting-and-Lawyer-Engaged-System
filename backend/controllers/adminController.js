const User = require('../models/User');
const Case = require('../models/Case');
const Message = require('../models/Message');
const Payment = require('../models/Payment');
const SystemConfig = require('../models/SystemConfig');
const Transaction = require('../models/Transaction');

// @desc    Get System Config
// @route   GET /api/admin/system-config
exports.getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) config = await SystemConfig.create({});
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update System Config
// @route   PUT /api/admin/system-config
exports.updateSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) config = await SystemConfig.create({});
    
    if (req.body.paymentsEnabled !== undefined) config.paymentsEnabled = req.body.paymentsEnabled;
    if (req.body.casePostingEnabled !== undefined) config.casePostingEnabled = req.body.casePostingEnabled;
    
    await config.save();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalLawyers = await User.countDocuments({ role: 'lawyer' });
    const verifiedLawyers = await User.countDocuments({ role: 'lawyer', isVerified: true });
    const pendingVerification = await User.countDocuments({ role: 'lawyer', isVerified: false });
    const totalCases = await Case.countDocuments();
    const openCases = await Case.countDocuments({ status: 'open' });
    const assignedCases = await Case.countDocuments({ status: 'assigned' });
    const resolvedCases = await Case.countDocuments({ status: 'resolved' });
    const successRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;
    
    // Average rating of all lawyers
    const lawyersWithRatings = await User.find({ role: 'lawyer', totalReviews: { $gt: 0 } });
    const avgLawyerRating = lawyersWithRatings.length > 0
      ? (lawyersWithRatings.reduce((acc, curr) => acc + curr.averageRating, 0) / lawyersWithRatings.length).toFixed(1)
      : 0;

    const totalMessages = await Message.countDocuments();
    
    // Fraud & Security Stats
    const flaggedUsers = await User.countDocuments({ isFlagged: true });
    const flaggedCases = await Case.countDocuments({ isFlagged: true });
    const pendingApprovalCases = await Case.countDocuments({ status: 'pending_approval' });

    // Case distribution by category
    const categoryDistribution = await Case.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent cases
    const recentCases = await Case.find()
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, clients: totalClients, lawyers: totalLawyers, verifiedLawyers, flagged: flaggedUsers },
        cases: { total: totalCases, open: openCases, assigned: assignedCases, resolved: resolvedCases, successRate, flagged: flaggedCases, pendingApproval: pendingApprovalCases },
        pendingVerification,
        avgLawyerRating,
        totalMessages,
        categoryDistribution,
        recentCases
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Advanced Analytics
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCases = await Case.countDocuments();
    const activeLawyers = await User.countDocuments({ role: 'lawyer', isVerified: true });
    
    const successfulPayments = await Payment.find({ status: 'success' });
    const successfulTransactions = await Transaction.find({ status: 'completed' });
    
    const revenueEarned = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0) +
                          successfulTransactions.reduce((acc, curr) => acc + curr.amount, 0);
                          
    const pendingPaymentsCount = await Payment.countDocuments({ status: { $ne: 'success' } }) +
                                 await Transaction.countDocuments({ status: { $ne: 'completed' } });

    const casesPerDay = await Case.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          cases: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 14 }
    ]);

    const unifiedRevenue = [...successfulPayments, ...successfulTransactions];
    const revenueByDate = {};
    unifiedRevenue.forEach(record => {
      if(record.createdAt) {
        const dateStr = new Date(record.createdAt).toISOString().split('T')[0];
        revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + record.amount;
      }
    });
    
    const revenueGrowth = Object.keys(revenueByDate).sort().slice(-14).map(date => ({
      _id: date,
      revenue: revenueByDate[date]
    }));

    const caseTypes = await Case.aggregate([
      { $group: { _id: "$category", value: { $sum: 1 } } }
    ]);

    const paymentStatsRaw = await Payment.aggregate([
      { $group: { _id: "$status", value: { $sum: 1 } } }
    ]);
    const transactionStatsRaw = await Transaction.aggregate([
      { $group: { _id: "$status", value: { $sum: 1 } } }
    ]);

    const combinedStatsMap = {};
    paymentStatsRaw.forEach(p => {
      combinedStatsMap[p._id] = (combinedStatsMap[p._id] || 0) + p.value;
    });
    transactionStatsRaw.forEach(t => {
      const mappedStatus = t._id === 'completed' ? 'success' : t._id;
      combinedStatsMap[mappedStatus] = (combinedStatsMap[mappedStatus] || 0) + t.value;
    });

    const paymentStats = Object.keys(combinedStatsMap).map(key => ({ name: key, value: combinedStatsMap[key] }));

    res.json({
      success: true,
      data: {
        overview: { totalUsers, totalCases, activeLawyers, revenueEarned, pendingPayments: pendingPaymentsCount },
        charts: {
          casesPerDay: casesPerDay.map(c => ({ date: c._id, cases: c.cases })),
          revenueGrowth: revenueGrowth.map(r => ({ date: r._id, revenue: r.revenue })),
          caseTypes: caseTypes.map(c => ({ name: c._id || 'Uncategorized', value: c.value })),
          paymentStats: paymentStats.map(p => ({ name: p._id, value: p.value }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Fraud Detection Intelligence
// @route   GET /api/admin/fraud-detection
exports.getFraudIntelligence = async (req, res) => {
  try {
    const highVolumeUsers = await Case.aggregate([
      { $group: { _id: "$postedBy", count: { $sum: 1 } } },
      { $match: { count: { $gt: 2 } } }
    ]);

    const flaggedUsersIds = highVolumeUsers.map(u => u._id);
    const manuallyFlagged = await User.find({ isFlagged: true }).select('_id');
    const allSuspiciousIds = [...new Set([...flaggedUsersIds, ...manuallyFlagged.map(u => u._id)])];

    const suspiciousUsers = await User.find({ _id: { $in: allSuspiciousIds } }).select('name email role createdAt isFlagged');

    const mappedThreats = await Promise.all(suspiciousUsers.map(async (user) => {
      const caseCount = await Case.countDocuments({ postedBy: user._id });
      let riskScore = 10;
      let reasons = [];
      
      if (user.isFlagged) {
        riskScore += 40;
        reasons.push('Manually flagged by Admin');
      }
      
      if (caseCount > 2) {
        riskScore += 35;
        reasons.push(`High API volume: ${caseCount} cases created`);
      }
      
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        riskScore: Math.min(riskScore, 100),
        reasons,
        isSpam: riskScore >= 70
      };
    }));

    res.json({ success: true, data: mappedThreats.sort((a,b) => b.riskScore - a.riskScore) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all cases with advanced filtering
// @route   GET /api/admin/cases
exports.getCases = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.category = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .populate('postedBy', 'name email')
      .populate('assignedLawyer', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: cases,
      pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Case (Admin Force Override)
// @route   DELETE /api/admin/cases/:id
exports.deleteCase = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) return res.status(404).json({ success: false, message: 'Case not found' });
    await caseItem.deleteOne();
    res.json({ success: true, message: 'Case securely deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
exports.getPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    // We fetch all from both collections, then manually sort and paginate.
    const paymentQuery = {};
    const transactionQuery = {};
    
    if (status && status !== 'all') {
      paymentQuery.status = status;
      transactionQuery.status = status === 'success' ? 'completed' : status;
    }

    const rawPayments = await Payment.find(paymentQuery)
      .populate('userId', 'name email')
      .populate('caseId', 'title category')
      .lean();

    const rawTransactions = await Transaction.find(transactionQuery)
      .populate('client', 'name email')
      .populate('appointment', '_id')
      .lean();

    const formattedPayments = rawPayments.map(p => ({
      _id: p._id,
      userId: p.userId,
      amount: p.amount,
      status: p.status,
      razorpay_payment_id: p.razorpay_payment_id,
      createdAt: p.createdAt,
      type: 'Case Fee',
      caseId: p.caseId
    }));

    const formattedTransactions = rawTransactions.map(t => ({
      _id: t._id,
      userId: t.client,
      amount: t.amount,
      status: t.status === 'completed' ? 'success' : t.status,
      razorpay_payment_id: t.transactionId,
      createdAt: t.createdAt,
      type: 'Consultation Fee',
      caseId: { _id: t.appointment?._id || t.appointment, title: t.description || 'Legal Consultation', category: 'General' }
    }));

    const allRecords = [...formattedPayments, ...formattedTransactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = allRecords.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    
    const paginatedRecords = allRecords.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedRecords,
      pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get cases pending approval
// @route   GET /api/admin/pending-cases
exports.getPendingCases = async (req, res) => {
  try {
    const cases = await Case.find({ status: 'pending_approval' })
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Reject case
// @route   PUT /api/admin/approve-case/:id
exports.approveCase = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const caseItem = await Case.findById(req.params.id);

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    caseItem.status = isApproved ? 'open' : 'closed';
    if (!isApproved) {
        caseItem.isFlagged = true;
        caseItem.flagReason = 'Rejected during administrative review.';
    }
    
    await caseItem.save();

    res.json({ success: true, message: isApproved ? 'Case approved' : 'Case rejected', data: caseItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all flagged users and cases
// @route   GET /api/admin/flagged-activities
exports.getFlaggedActivities = async (req, res) => {
  try {
    const flaggedUsers = await User.find({ isFlagged: true }).select('name email role flagReason updatedAt');
    const flaggedCases = await Case.find({ isFlagged: true }).populate('postedBy', 'name email').select('title flagReason updatedAt');

    res.json({
      success: true,
      data: {
        users: flaggedUsers,
        cases: flaggedCases
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Dismiss/Toggle flag status
// @route   PUT /api/admin/toggle-flag/:type/:id
exports.toggleFlagStatus = async (req, res) => {
  try {
    const { type, id } = req.params;
    let item;

    if (type === 'user') {
      item = await User.findById(id);
    } else {
      item = await Case.findById(id);
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.isFlagged = !item.isFlagged;
    if (!item.isFlagged) item.flagReason = '';
    
    await item.save();

    res.json({ success: true, message: 'Flag status updated', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users,
      pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending lawyer verifications
// @route   GET /api/admin/pending-lawyers
exports.getPendingLawyers = async (req, res) => {
  try {
    const lawyers = await User.find({ role: 'lawyer', isVerified: false })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: lawyers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify/Reject lawyer
// @route   PUT /api/admin/verify-lawyer/:id
exports.verifyLawyer = async (req, res) => {
  try {
    const { isVerified } = req.body;
    const lawyer = await User.findById(req.params.id);

    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(404).json({ success: false, message: 'Lawyer not found' });
    }

    lawyer.isVerified = isVerified;
    await lawyer.save();

    res.json({
      success: true,
      message: isVerified ? 'Lawyer verified successfully' : 'Lawyer verification rejected',
      data: lawyer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get all conversations in the system (Admin only)
// @route   GET /api/admin/conversations
exports.getGlobalConversations = async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$sender', '$receiver'] },
              { u1: '$sender', u2: '$receiver' },
              { u1: '$receiver', u2: '$sender' }
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);

    // Populate user details for each pair
    const populated = await Promise.all(conversations.map(async (conv) => {
      const u1 = await User.findById(conv._id.u1).select('name email role avatar');
      const u2 = await User.findById(conv._id.u2).select('name email role avatar');
      return {
        user1: u1,
        user2: u2,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        messageCount: conv.messageCount
      };
    }));

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get messages between any two users (Admin only)
// @route   GET /api/admin/messages/:u1/:u2
exports.getGlobalMessages = async (req, res) => {
  try {
    const { u1, u2 } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: u1, receiver: u2 },
        { sender: u2, receiver: u1 }
      ]
    })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/toggle-user/:id
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? 'User activated' : 'User deactivated',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
