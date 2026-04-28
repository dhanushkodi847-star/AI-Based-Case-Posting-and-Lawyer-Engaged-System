const Review = require('../models/Review');
const Case = require('../models/Case');

// @desc    Create a new review
// @route   POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { caseId, rating, comment } = req.body;

    // Check if case exists and is resolved
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (caseItem.status !== 'resolved' && caseItem.status !== 'closed') {
      return res.status(400).json({ success: false, message: 'Case must be resolved before providing a review' });
    }

    // Verify user is the one who posted the case
    if (caseItem.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the case owner can provide a review' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ case: caseId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this case' });
    }

    const review = await Review.create({
      case: caseId,
      lawyer: caseItem.assignedLawyer,
      client: req.user._id,
      rating,
      comment
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a lawyer
// @route   GET /api/reviews/lawyer/:lawyerId
exports.getLawyerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ lawyer: req.params.lawyerId })
      .populate('client', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
