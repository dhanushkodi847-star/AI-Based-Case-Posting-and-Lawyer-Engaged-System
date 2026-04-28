const express = require('express');
const router = express.Router();
const {
  createCase, getCases, getCaseById, getMyCases,
  updateCaseStatus, assignLawyer, classifyCaseText, deleteCase, addCourtDate
} = require('../controllers/caseController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.array('documents', 5), createCase);
router.get('/', getCases);
router.get('/my/cases', protect, getMyCases);
router.post('/classify', protect, classifyCaseText);
router.get('/:id', getCaseById);
router.put('/:id/status', protect, updateCaseStatus);
router.put('/:id/assign', protect, assignLawyer);
router.delete('/:id', protect, deleteCase);
router.post('/:id/court-date', protect, authorize('lawyer', 'admin'), addCourtDate);

module.exports = router;
