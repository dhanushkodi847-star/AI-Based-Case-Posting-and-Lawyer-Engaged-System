const User = require('../models/User');
const Case = require('../models/Case');
const Notification = require('../models/Notification');

// @desc    Get all verified lawyers (with filters)
// @route   GET /api/lawyers
exports.getLawyers = async (req, res) => {
  try {
    const { specialization, search, page = 1, limit = 10 } = req.query;

    const query = { role: 'lawyer', isVerified: true, isActive: true };

    if (specialization) {
      query.specializations = specialization;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const lawyers = await User.find(query)
      .select('-password')
      .sort({ experience: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: lawyers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get lawyer profile by ID
// @route   GET /api/lawyers/:id
exports.getLawyerById = async (req, res) => {
  try {
    const lawyer = await User.findById(req.params.id).select('-password');

    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(404).json({ success: false, message: 'Lawyer not found' });
    }

    // Get case stats for this lawyer
    const assignedCases = await Case.countDocuments({ assignedLawyer: lawyer._id });
    const resolvedCases = await Case.countDocuments({ assignedLawyer: lawyer._id, status: 'resolved' });

    res.json({
      success: true,
      data: {
        ...lawyer.toObject(),
        stats: { assignedCases, resolvedCases }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get cases matching lawyer's specialization
// @route   GET /api/lawyers/matching-cases
exports.getMatchingCases = async (req, res) => {
  try {
    const lawyer = await User.findById(req.user._id);

    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(403).json({ success: false, message: 'Only lawyers can access this' });
    }

    const { page = 1, limit = 10 } = req.query;

    // Find open cases matching lawyer's specializations
    const query = {
      status: 'open',
      isPublic: true,
      category: { $in: lawyer.specializations }
    };

    const total = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .populate('postedBy', 'name email location')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: cases,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Express interest in a case
// @route   POST /api/lawyers/interest/:caseId
exports.expressInterest = async (req, res) => {
  try {
    const { message } = req.body;
    const caseItem = await Case.findById(req.params.caseId);

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Check if already expressed interest
    const alreadyInterested = caseItem.interestedLawyers.find(
      (item) => item.lawyer.toString() === req.user._id.toString()
    );

    if (alreadyInterested) {
      return res.status(400).json({ success: false, message: 'Already expressed interest in this case' });
    }

    caseItem.interestedLawyers.push({
      lawyer: req.user._id,
      message: message || 'I am interested in handling this case.'
    });

    await caseItem.save();

    // Create Notification for the client
    try {
      const lawyer = await User.findById(req.user._id);
      const notification = await Notification.create({
        user: caseItem.postedBy,
        type: 'case_interest',
        title: 'New Interest in Case',
        message: `${lawyer.name} is interested in your case: "${caseItem.title}"`,
        link: `/cases/${caseItem._id}`
      });

      // Emit socket event if io is available
      const io = req.app.get('io');
      if (io) {
        io.to(caseItem.postedBy.toString()).emit('newNotification', notification);
      }
    } catch (err) {
      console.error('Notification trigger failed:', err);
    }

    const updatedCase = await Case.findById(caseItem._id)
      .populate('interestedLawyers.lawyer', 'name email specializations experience');

    res.json({ success: true, data: updatedCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get lawyer's assigned cases
// @route   GET /api/lawyers/my-cases
exports.getMyAssignedCases = async (req, res) => {
  try {
    const cases = await Case.find({ assignedLawyer: req.user._id })
      .populate('postedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get cases lawyer has expressed interest in
// @route   GET /api/lawyers/interested-cases
exports.getInterestedCases = async (req, res) => {
  try {
    const cases = await Case.find({ 'interestedLawyers.lawyer': req.user._id })
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
