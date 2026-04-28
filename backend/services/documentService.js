const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a legal affidavit PDF
 */
exports.generateAffidavit = (data, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('AFFIDAVIT', { align: 'center', underline: true });
      doc.moveDown(2);

      // Main Text
      doc.fontSize(12).text(`I, ${data.fullName}, son/daughter/wife of ${data.parentName}, aged about ${data.age} years, residing at ${data.address}, do hereby solemnly affirm and state on oath as follows:`, { align: 'justify', lineGap: 5 });
      doc.moveDown();

      // Points
      data.points.forEach((point, index) => {
        doc.text(`${index + 1}. ${point}`, { align: 'justify', lineGap: 5 });
        doc.moveDown();
      });

      doc.moveDown(2);
      doc.text('VERIFICATION', { align: 'center', bold: true, underline: true });
      doc.moveDown();
      doc.text(`Verified at ${data.location} on this ${new Date().toLocaleDateString()}, that the contents of the above affidavit are true and correct to the best of my knowledge and belief, and nothing material has been concealed therefrom.`, { align: 'justify' });

      doc.moveDown(4);

      // Signatures
      const sigY = doc.y;
      doc.text('DEPONENT', 400, sigY, { align: 'right' });

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate a simple Rent Agreement
 */
exports.generateRentAgreement = (data, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      doc.fontSize(18).text('RENT AGREEMENT', { align: 'center', underline: true });
      doc.moveDown(2);

      doc.fontSize(12).text(`This Rent Agreement is made on ${data.agreementDate} between:`, { align: 'left' });
      doc.moveDown();
      doc.text(`LANDLORD: ${data.landlordName}, residing at ${data.landlordAddress}`, { indent: 20 });
      doc.text(`AND`, { align: 'center', italics: true });
      doc.text(`TENANT: ${data.tenantName}, residing at ${data.tenantAddress}`, { indent: 20 });
      doc.moveDown();

      doc.text(`The Landlord hereby agrees to let the premises situated at ${data.propertyAddress} to the Tenant on a monthly rent of Rs. ${data.monthlyRent} for a period of ${data.durationMonths} months.`);
      doc.moveDown();

      doc.text('TERMS AND CONDITIONS:', { underline: true });
      doc.moveDown(0.5);
      doc.text('1. The Tenant shall pay the rent on or before the 5th of every month.');
      doc.text(`2. A security deposit of Rs. ${data.securityDeposit} has been paid by the Tenant.`);
      doc.text('3. The Tenant shall not sublet the premises.');
      doc.moveDown(3);

      doc.text('LANDLORD', 50, doc.y, { continued: true });
      doc.text('TENANT', 350, doc.y, { align: 'right' });

      doc.end();
      stream.on('finish', () => resolve(outputPath));
    } catch (err) {
      reject(err);
    }
  });
};
