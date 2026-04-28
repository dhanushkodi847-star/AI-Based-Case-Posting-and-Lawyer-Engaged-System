const Case = require('../models/Case');
const Notification = require('../models/Notification');
const { classifyCase, suggestPriority, extractEntities } = require('../services/classifierService');
const { analyzeCase } = require('../utils/fraudDetector');

// @desc    Create a new case
// @route   POST /api/cases
exports.createCase = async (req, res) => {
  try {
    const { title, description, category, location, isPublic, priority } = req.body;

    // AI Classification
    const aiLabels = classifyCase(title, description);
    const suggestedPriority = suggestPriority(`${title} ${description}`);
    const entities = extractEntities(`${title} ${description}`);

    // Auto-assign category from AI if not provided
    const autoCategory = category || (aiLabels.length > 0 ? aiLabels[0].label : 'Other');

    // Handle file uploads
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype
        });
      });
    }

    // Fraud and Sensitivity Detection
    const fraudAnalysis = analyzeCase({ title, description });
    
    let initialStatus = 'open';
    let isFlagged = false;
    let flagReason = '';

    if (fraudAnalysis.isFlagged) {
      isFlagged = true;
      flagReason = fraudAnalysis.reason;
    }

    if (fraudAnalysis.isSensitive) {
      initialStatus = 'pending_approval';
    }

    const newCase = await Case.create({
      title,
      description,
      category: autoCategory,
      aiLabels,
      status: initialStatus,
      isFlagged,
      flagReason,
      priority: priority || suggestedPriority,
      postedBy: req.user._id,
      documents,
      location,
      isPublic: isPublic !== undefined ? isPublic : true
    });

    const populatedCase = await Case.findById(newCase._id).populate('postedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedCase,
      aiAnalysis: {
        labels: aiLabels,
        suggestedPriority,
        entities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all cases (with filters)
// @route   GET /api/cases
exports.getCases = async (req, res) => {
  try {
    const { category, status, priority, search, page = 1, limit = 10 } = req.query;

    const query = { isPublic: true };

    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$text = { $search: search };
    }

    const total = await Case.countDocuments(query);
    const cases = await Case.find(query)
      .populate('postedBy', 'name email')
      .populate('assignedLawyer', 'name email specializations')
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

// @desc    Get single case by ID
// @route   GET /api/cases/:id
exports.getCaseById = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id)
      .populate('postedBy', 'name email phone')
      .populate('assignedLawyer', 'name email specializations experience averageRating totalReviews')
      .populate('interestedLawyers.lawyer', 'name email specializations experience averageRating totalReviews');

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    res.json({ success: true, data: caseItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my cases (client)
// @route   GET /api/cases/my/cases
exports.getMyCases = async (req, res) => {
  try {
    const cases = await Case.find({ postedBy: req.user._id })
      .populate('assignedLawyer', 'name email specializations')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update case status
// @route   PUT /api/cases/:id/status
exports.updateCaseStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['open', 'accepted', 'in-progress', 'resolved', 'closed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const caseItem = await Case.findById(req.params.id);

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const isOwner = caseItem.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssignedLawyer = caseItem.assignedLawyer && caseItem.assignedLawyer.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin && !isAssignedLawyer) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this case' });
    }

    caseItem.status = status;
    await caseItem.save();

    // Trigger Notification if resolved
    if (status === 'resolved' && caseItem.assignedLawyer) {
      try {
        const notification = await Notification.create({
          user: caseItem.assignedLawyer,
          type: 'system',
          title: 'Case Resolved!',
          message: `The case "${caseItem.title}" has been marked as resolved. Congratulations!`,
          link: `/cases/${caseItem._id}`
        });

        const io = req.app.get('io');
        if (io) {
          io.to(caseItem.assignedLawyer.toString()).emit('newNotification', notification);
        }
      } catch (err) {
        console.error('Resolution notification failed:', err);
      }
    }

    res.json({ success: true, data: caseItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign lawyer to case
// @route   PUT /api/cases/:id/assign
exports.assignLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.body;
    const caseItem = await Case.findById(req.params.id);

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (caseItem.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the case owner can assign a lawyer' });
    }

    caseItem.assignedLawyer = lawyerId;
    caseItem.status = 'assigned';
    await caseItem.save();

    // Create Notification for the lawyer
    try {
      const notification = await Notification.create({
        user: lawyerId,
        type: 'case_assignment',
        title: 'New Case Assignment',
        message: `You have been assigned to the case: "${caseItem.title}"`,
        link: `/cases/${caseItem._id}`
      });

      // Emit socket event if io is available
      const io = req.app.get('io');
      if (io) {
        io.to(lawyerId.toString()).emit('newNotification', notification);
      }
    } catch (err) {
      console.error('Notification trigger failed:', err);
    }

    const updatedCase = await Case.findById(caseItem._id)
      .populate('postedBy', 'name email')
      .populate('assignedLawyer', 'name email specializations averageRating totalReviews');

    res.json({ success: true, data: updatedCase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Classify case text (preview without saving)
// @route   POST /api/cases/classify
exports.classifyCaseText = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title && !description) {
      return res.status(400).json({ success: false, message: 'Please provide title or description' });
    }

    const aiLabels = classifyCase(title || '', description || '');
    const suggestedPriority = suggestPriority(`${title || ''} ${description || ''}`);
    const entities = extractEntities(`${title || ''} ${description || ''}`);

    res.json({
      success: true,
      data: {
        labels: aiLabels,
        suggestedPriority,
        entities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete case
// @route   DELETE /api/cases/:id
exports.deleteCase = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (caseItem.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this case' });
    }

    await Case.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Case deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a court date to a case
// @route   POST /api/cases/:id/court-date
exports.addCourtDate = async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const caseItem = await Case.findById(req.params.id);

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Only assigned lawyer or admin can add court dates
    if (caseItem.assignedLawyer?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add court dates to this case' });
    }

    caseItem.courtDates.push({ title, date, description });
    await caseItem.save();

    res.json({ success: true, data: caseItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
