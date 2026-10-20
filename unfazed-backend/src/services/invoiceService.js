const PDFDocument = require('pdfkit');

/**
 * Generates a GST-compliant tax invoice PDF buffer using PDFKit
 * SAC 999312 is the official Indian Service Accounting Code for Human Health and Psychology Services
 */
const generateInvoicePDF = (payment, therapist, client) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#0f766e'; // teal-700
      const darkColor = '#1e293b'; // slate-800
      const grayColor = '#64748b'; // slate-500
      const lightBg = '#f8fafc';

      // --- Header ---
      doc
        .fontSize(22)
        .fillColor(primaryColor)
        .text('UNFAZED', 40, 45, { characterSpacing: 1 })
        .fontSize(9)
        .fillColor(grayColor)
        .text('CLINICAL PRACTICE MANAGEMENT', 40, 70);

      doc
        .fontSize(16)
        .fillColor(darkColor)
        .text('TAX INVOICE', 350, 45, { align: 'right' })
        .fontSize(9)
        .fillColor(grayColor)
        .text(`Original for Recipient`, 350, 68, { align: 'right' });

      doc.moveTo(40, 95).lineTo(555, 95).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // --- Meta Details Row ---
      doc.fontSize(9).fillColor(grayColor);
      doc.text('Invoice Number:', 40, 110);
      doc.text('Invoice Date:', 40, 125);
      doc.text('Place of Supply:', 40, 140);

      doc.fontSize(9).fillColor(darkColor);
      doc.text(payment.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`, 130, 110);
      doc.text(
        new Date(payment.paidAt || payment.createdAt || Date.now()).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        130,
        125
      );
      doc.text(therapist?.address?.state || 'Karnataka (29)', 130, 140);

      // Status Badge
      doc
        .rect(460, 108, 95, 24)
        .fill('#ecfdf5');
      doc
        .fontSize(10)
        .fillColor('#047857')
        .text('PAYMENT: PAID', 465, 114, { align: 'center', width: 85 });

      // --- Addresses (Therapist & Client) ---
      const addressTop = 175;

      // Provider details (Therapist)
      doc.fontSize(10).fillColor(primaryColor).text('PROVIDER (BILLED FROM)', 40, addressTop);
      doc.fontSize(10).fillColor(darkColor).text(therapist?.name || 'Therapist Practice', 40, addressTop + 16);
      doc.fontSize(9).fillColor(grayColor);
      doc.text(therapist?.title || 'Licensed Clinical Psychologist', 40, addressTop + 30);
      doc.text(therapist?.address?.clinicName || 'Therapy Practice Clinic', 40, addressTop + 44);
      doc.text(`${therapist?.address?.street || ''}, ${therapist?.address?.city || ''}`, 40, addressTop + 58);
      doc.text(`GSTIN: ${therapist?.address?.gstin || '29ABCDE1234F1Z5'}`, 40, addressTop + 72);

      // Client details
      doc.fontSize(10).fillColor(primaryColor).text('BILLED TO (CLIENT)', 320, addressTop);
      doc.fontSize(10).fillColor(darkColor).text(client?.name || payment.clientName || 'Client', 320, addressTop + 16);
      doc.fontSize(9).fillColor(grayColor);
      doc.text(`Email: ${client?.email || payment.clientEmail || 'N/A'}`, 320, addressTop + 30);
      doc.text(`Phone: ${client?.phone || 'N/A'}`, 320, addressTop + 44);
      doc.text(`Transaction Ref: ${payment.gateway_payment_id || 'Direct'}`, 320, addressTop + 58);

      // --- Table of Items ---
      const tableTop = 280;

      // Header background
      doc.rect(40, tableTop, 515, 24).fill('#f1f5f9');
      doc.fontSize(9).fillColor(darkColor);
      doc.text('DESCRIPTION', 50, tableTop + 7);
      doc.text('SAC CODE', 260, tableTop + 7);
      doc.text('QTY', 340, tableTop + 7);
      doc.text('RATE (INR)', 390, tableTop + 7);
      doc.text('AMOUNT (INR)', 470, tableTop + 7, { align: 'right', width: 75 });

      const itemDesc = payment.itemDescription || 'Psychological Consultation & Therapy Session';
      const itemPrice = payment.amount || 1500;
      const subtotal = Math.round((itemPrice / 1.18) * 100) / 100;
      const cgst = Math.round((subtotal * 0.09) * 100) / 100;
      const sgst = Math.round((subtotal * 0.09) * 100) / 100;

      const rowTop = tableTop + 32;
      doc.fontSize(9).fillColor(darkColor);
      doc.text(itemDesc, 50, rowTop, { width: 200 });
      doc.text('999312', 260, rowTop);
      doc.text('1', 340, rowTop);
      doc.text(subtotal.toFixed(2), 390, rowTop);
      doc.text(subtotal.toFixed(2), 470, rowTop, { align: 'right', width: 75 });

      // Line separator
      doc.moveTo(40, rowTop + 30).lineTo(555, rowTop + 30).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      // --- Summary / Totals ---
      const summaryTop = rowTop + 45;
      const rightCol = 430;
      const rightVal = 475;

      doc.fontSize(9).fillColor(grayColor);
      doc.text('Taxable Subtotal:', rightCol - 50, summaryTop);
      doc.fillColor(darkColor).text(`INR ${subtotal.toFixed(2)}`, rightVal, summaryTop, { align: 'right', width: 70 });

      doc.fontSize(9).fillColor(grayColor);
      doc.text('CGST (9%):', rightCol - 50, summaryTop + 16);
      doc.fillColor(darkColor).text(`INR ${cgst.toFixed(2)}`, rightVal, summaryTop + 16, { align: 'right', width: 70 });

      doc.fontSize(9).fillColor(grayColor);
      doc.text('SGST (9%):', rightCol - 50, summaryTop + 32);
      doc.fillColor(darkColor).text(`INR ${sgst.toFixed(2)}`, rightVal, summaryTop + 32, { align: 'right', width: 70 });

      // Total Box
      doc.rect(rightCol - 60, summaryTop + 52, 185, 26).fill('#0f766e');
      doc.fontSize(10).fillColor('#ffffff').text('TOTAL PAID:', rightCol - 50, summaryTop + 59);
      doc.text(`INR ${itemPrice.toFixed(2)}`, rightVal - 5, summaryTop + 59, { align: 'right', width: 80 });

      // --- Notes & Disclaimer ---
      const footerTop = 530;
      doc.fontSize(8).fillColor(grayColor);
      doc.text('Declaration & Medical Privacy Note:', 40, footerTop);
      doc.text(
        '1. This is a computer-generated tax invoice issued under Rule 46 of the CGST Rules, 2017.\n' +
        '2. Psychological and mental health therapy sessions are classified under SAC 999312.\n' +
        '3. All clinical records and consultations are strictly confidential in accordance with the Mental Healthcare Act, 2017.',
        40,
        footerTop + 14,
        { width: 515, lineGap: 3 }
      );

      // Footer stamp / Sign
      doc.text('Authorized Signatory', 430, footerTop + 65, { align: 'right', width: 120 });
      doc.text(`${therapist?.name || 'Therapist'}`, 430, footerTop + 78, { align: 'right', width: 120 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateInvoicePDF,
};
