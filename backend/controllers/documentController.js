const documentService = require('../services/documentService');
const path = require('path');
const fs = require('fs');

// @desc    Generate a legal document
// @route   POST /api/documents/generate
exports.generateDocument = async (req, res) => {
  try {
    const { type, data } = req.body;
    
    // Ensure uploads/documents directory exists
    const docsDir = path.join(__dirname, '../public/uploads/documents');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const filename = `${type}_${Date.now()}.pdf`;
    const outputPath = path.join(docsDir, filename);

    let resultPath;
    if (type === 'affidavit') {
      resultPath = await documentService.generateAffidavit(data, outputPath);
    } else if (type === 'rent_agreement') {
      resultPath = await documentService.generateRentAgreement(data, outputPath);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }

    const downloadUrl = `/uploads/documents/${filename}`;

    res.json({
      success: true,
      message: `${type} generated successfully`,
      data: {
        filename,
        url: downloadUrl
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
