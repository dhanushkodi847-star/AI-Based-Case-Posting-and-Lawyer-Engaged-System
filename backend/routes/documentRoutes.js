const express = require('express');
const router = express.Router();
const { generateDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateDocument);

module.exports = router;
