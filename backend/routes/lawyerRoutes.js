const express = require('express');
const router = express.Router();
const {
  getLawyers, getLawyerById, getMatchingCases,
  expressInterest, getMyAssignedCases, getInterestedCases
} = require('../controllers/lawyerController');
const { protect, lawyer } = require('../middleware/authMiddleware');

router.get('/', getLawyers);
router.get('/matching-cases', protect, lawyer, getMatchingCases);
router.get('/my-cases', protect, lawyer, getMyAssignedCases);
router.get('/interested-cases', protect, lawyer, getInterestedCases);
router.post('/interest/:caseId', protect, lawyer, expressInterest);
router.get('/:id', getLawyerById);

module.exports = router;
