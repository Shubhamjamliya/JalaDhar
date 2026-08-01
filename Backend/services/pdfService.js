const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { uploadFileToCloudinary } = require('./cloudinaryService');
const { getSettings } = require('./settingsService');

/**
 * Generate Marketplace Tax Invoice PDF for booking
 * @param {Object} booking - Booking object with populated user, vendor, service
 * @returns {Promise<Object>} Invoice details with URL
 */
const generateInvoice = async (booking) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch admin configured billing settings
      const settings = await getSettings([
        'BILLING_COMPANY_NAME',
        'BILLING_ADDRESS',
        'BILLING_GSTIN',
        'BILLING_PAN',
        'BILLING_PHONE',
        'BILLING_EMAIL',
        'BILLING_WEBSITE',
        'BILLING_SAC_CODE',
        'BILLING_PLACE_OF_SUPPLY',
        'BILLING_DECLARATION'
      ]);

      const companyName = settings.BILLING_COMPANY_NAME || 'Jaladhaara Hydrogeological Services Pvt. Ltd.';
      const companyAddress = settings.BILLING_ADDRESS || '123, Water Tower Complex, Near Borewell Circle, Civil Lines, Raipur, Chhattisgarh - 492001';
      const companyGstin = settings.BILLING_GSTIN || '22AAAAA0000A1Z5';
      const companyPan = settings.BILLING_PAN || 'AAACJ1234F';
      const companyPhone = settings.BILLING_PHONE || '+91 98765 43210';
      const companyEmail = settings.BILLING_EMAIL || 'billing@jaladhar.com';
      const companyWebsite = settings.BILLING_WEBSITE || 'https://jaladhaaraapp.in';
      const sacCode = settings.BILLING_SAC_CODE || '998341';
      const placeOfSupply = settings.BILLING_PLACE_OF_SUPPLY || 'Chhattisgarh (State Code: 22)';
      const declaration = settings.BILLING_DECLARATION || 'This is a computer-generated Tax Invoice and does not require a physical signature.';

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const dateStr = new Date(booking.payment?.createdAt || booking.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
      const invoiceNumber = `INV-${dateStr}-${booking._id.toString().slice(-6).toUpperCase()}`;
      const fileName = `invoice-${booking._id}-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../temp', fileName);

      // Ensure temp directory exists
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create write stream
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Colors
      const primaryColor = '#0A84FF';
      const textColor = '#1F2937';
      const grayColor = '#4B5563';

      // Header: Brand & Title
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(companyName.toUpperCase(), 40, 40, { width: 250 });
      doc.fillColor(grayColor).fontSize(7.5).font('Helvetica').text('GROUNDWATER & HYDROGEOLOGICAL SERVICES', 40, 60);
      doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text('TAX INVOICE / PAYMENT RECEIPT', 40, 74);

      // Header Right: Company Info
      doc.fillColor(textColor).fontSize(8.5).font('Helvetica-Bold').text(companyName, 300, 40, { align: 'right' });
      doc.fillColor(grayColor).fontSize(7.5).font('Helvetica').text(companyAddress, 300, 52, { align: 'right', width: 255 });
      doc.fillColor(primaryColor).font('Helvetica-Bold').text(`GSTIN: ${companyGstin}`, 300, 72, { align: 'right' });
      doc.fillColor(grayColor).font('Helvetica').text(`PAN: ${companyPan} | Ph: ${companyPhone}`, 300, 83, { align: 'right' });
      doc.text(`Email: ${companyEmail}`, 300, 93, { align: 'right' });

      // Divider
      doc.moveTo(40, 108).lineTo(555, 108).strokeColor('#E5E7EB').lineWidth(1).stroke();

      // Invoice Details Bar
      let currentY = 116;
      doc.fillColor(textColor).fontSize(8.5).font('Helvetica-Bold').text(`Invoice No: ${invoiceNumber}`, 40, currentY);
      doc.text(`Order ID: ORD-${booking._id.toString().slice(-8).toUpperCase()}`, 210, currentY);
      const isPaid = booking.payment?.remainingPaid;
      doc.fillColor(isPaid ? '#059669' : '#D97706').text(`Status: ${isPaid ? 'PAID IN FULL' : 'PARTIALLY PAID'}`, 430, currentY, { align: 'right' });

      currentY += 13;
      doc.fillColor(grayColor).fontSize(7.5).font('Helvetica').text(`Date & Time: ${new Date(booking.payment?.createdAt || booking.createdAt).toLocaleString('en-IN')}`, 40, currentY);
      doc.text(`Place of Supply: ${placeOfSupply}`, 210, currentY);
      doc.text(`Reverse Charge: NO`, 430, currentY, { align: 'right' });

      // Customer & Service Section Box
      currentY += 18;
      doc.rect(40, currentY, 515, 75).fillAndStroke('#F9FAFB', '#F3F4F6');

      // Customer Column (Left)
      doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold').text('CUSTOMER DETAILS (BILLED TO)', 50, currentY + 6);
      doc.fillColor(textColor).fontSize(9.5).font('Helvetica-Bold').text(booking.user?.name || 'Customer', 50, currentY + 18);
      doc.fillColor(grayColor).fontSize(7.5).font('Helvetica').text(`Ph: ${booking.user?.phone || 'N/A'} | Email: ${booking.user?.email || 'N/A'}`, 50, currentY + 31);
      if (booking.address) {
        const addr = `${booking.address.street || ''}, ${booking.address.city || ''}, ${booking.address.state || ''} - ${booking.address.pincode || ''}`;
        doc.text(`Address: ${addr.slice(0, 50)}`, 50, currentY + 43);
      }

      // Expert & Service Column (Right)
      doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold').text('ASSIGNED EXPERT & SERVICE', 310, currentY + 6);
      doc.fillColor(textColor).fontSize(9.5).font('Helvetica-Bold').text(booking.vendor?.name || 'Assigned Expert', 310, currentY + 18);
      doc.fillColor(grayColor).fontSize(7.5).font('Helvetica').text(`Service: ${booking.service?.name || 'Groundwater Survey'}`, 310, currentY + 31);
      doc.text(`Machine: ${booking.service?.machineType || 'Resistivity / ADMT / PQWT'}`, 310, currentY + 43);
      doc.text(`Scheduled Visit: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN')}`, 310, currentY + 55);

      // Items Table Header with SAC Code
      currentY += 88;
      doc.rect(40, currentY, 515, 18).fill('#0A84FF');
      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('ITEM / SERVICE DESCRIPTION', 50, currentY + 5);
      doc.text('SAC CODE', 270, currentY + 5, { width: 60, align: 'center' });
      doc.text('QTY', 340, currentY + 5, { width: 30, align: 'center' });
      doc.text('UNIT PRICE (₹)', 380, currentY + 5, { width: 70, align: 'right' });
      doc.text('TOTAL (₹)', 460, currentY + 5, { width: 85, align: 'right' });

      // Table Row - Base Service
      currentY += 18;
      doc.fillColor(textColor).fontSize(8.5).font('Helvetica-Bold');
      const baseFee = booking.payment?.baseServiceFee || booking.service?.price || 0;
      doc.text(booking.service?.name || 'Groundwater Hydrogeological Survey', 50, currentY + 5);
      doc.fontSize(7).font('Helvetica').fillColor(grayColor).text(`Hydrogeological survey & report (${booking.service?.machineType || 'Standard Machine'})`, 50, currentY + 16);

      doc.fillColor(textColor).fontSize(8.5).font('Helvetica');
      doc.text(sacCode, 270, currentY + 5, { width: 60, align: 'center' });
      doc.font('Helvetica-Bold').text('1', 340, currentY + 5, { width: 30, align: 'center' });
      doc.text(baseFee.toFixed(2), 380, currentY + 5, { width: 70, align: 'right' });
      doc.text(baseFee.toFixed(2), 460, currentY + 5, { width: 85, align: 'right' });

      currentY += 28;

      // Table Row - Travel Charges if applicable
      const travelCharges = booking.payment?.travelCharges || 0;
      if (travelCharges > 0) {
        doc.fillColor(textColor).fontSize(8.5).font('Helvetica-Bold');
        doc.text('Travel & Mobilization Charges', 50, currentY + 4);
        doc.fontSize(7).font('Helvetica').fillColor(grayColor).text(`Round trip calculated for ${booking.payment?.distance?.toFixed(1) || '0'} km`, 50, currentY + 15);

        doc.fillColor(textColor).fontSize(8.5).font('Helvetica');
        doc.text(sacCode, 270, currentY + 4, { width: 60, align: 'center' });
        doc.font('Helvetica-Bold').text('1', 340, currentY + 4, { width: 30, align: 'center' });
        doc.text(travelCharges.toFixed(2), 380, currentY + 4, { width: 70, align: 'right' });
        doc.text(travelCharges.toFixed(2), 460, currentY + 4, { width: 85, align: 'right' });
        currentY += 28;
      }

      // Summary Block (Right aligned)
      currentY += 8;
      const gstTotal = booking.payment?.gst || (baseFee * 0.18);
      const cgst = gstTotal / 2;
      const sgst = gstTotal / 2;
      const grandTotal = booking.payment?.totalAmount || (baseFee + gstTotal + travelCharges);

      const summaryX = 350;
      doc.fillColor(grayColor).fontSize(7.5).font('Helvetica');
      doc.text('Base Service Fee:', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${baseFee.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 12;
      doc.fillColor(grayColor).font('Helvetica').text('Taxable Value:', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${(baseFee + travelCharges).toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 12;
      doc.fillColor(grayColor).font('Helvetica').text('CGST (9%):', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${cgst.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 12;
      doc.fillColor(grayColor).font('Helvetica').text('SGST (9%):', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${sgst.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 12;
      doc.fillColor(grayColor).font('Helvetica').text('Total GST (18%):', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${gstTotal.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 15;
      doc.rect(340, currentY - 3, 215, 20).fill('#0A84FF');
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
      doc.text('GRAND TOTAL:', 350, currentY + 2);
      doc.text(`₹ ${grandTotal.toFixed(2)}`, 450, currentY + 2, { width: 95, align: 'right' });

      currentY += 22;
      const numberToWordsINR = (amt) => {
        const num = Math.round(Number(amt || 0));
        if (num === 0) return "Zero Rupees Only";
        const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
        const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        const inW = (n) => {
          if (n < 20) return a[n];
          if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
          if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + inW(n % 100) : "");
          if (n < 100000) return inW(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inW(n % 1000) : "");
          if (n < 10000000) return inW(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inW(n % 100000) : "");
          return inW(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inW(n % 10000000) : "");
        };
        return (inW(num).trim() + " Rupees Only");
      };

      doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-BoldOblique').text(`Amount in Words: ${numberToWordsINR(grandTotal)}`, 300, currentY, { width: 255, align: 'right' });

      // Payment Audit Trail Table for BOTH Advance & Final Payments
      currentY += 16;
      doc.rect(40, currentY, 515, 55).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold').text('PAYMENT RECEIPTS & TRANSACTION AUDIT TRAIL', 50, currentY + 5);

      const advanceTxn = booking.payment?.advanceRazorpayPaymentId || booking.payment?.advanceTransactionId || `pay_ADV_${booking._id.toString().slice(-6).toUpperCase()}`;
      const remainingTxn = isPaid
        ? (booking.payment?.remainingRazorpayPaymentId || booking.payment?.remainingTransactionId || `pay_REM_${booking._id.toString().slice(-6).toUpperCase()}`)
        : 'Awaiting Payment';

      const advanceAmt = booking.payment?.advanceAmount || 0;
      const remainingAmt = booking.payment?.remainingAmount || 0;

      doc.fillColor(grayColor).fontSize(7).font('Helvetica');
      doc.text('Advance Payment (40%):', 50, currentY + 18);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`Txn: ${advanceTxn}`, 160, currentY + 18);
      doc.fillColor('#059669').text(`-₹ ${advanceAmt.toFixed(2)} (PAID)`, 450, currentY + 18, { align: 'right' });

      doc.fillColor(grayColor).font('Helvetica').text('Remaining Payment (60%):', 50, currentY + 30);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`Txn: ${remainingTxn}`, 160, currentY + 30);
      doc.fillColor(isPaid ? '#059669' : '#D97706').text(`${isPaid ? '-₹ ' : '₹ '}${remainingAmt.toFixed(2)} (${isPaid ? 'PAID' : 'PENDING'})`, 450, currentY + 30, { align: 'right' });

      doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold');
      doc.text(`TOTAL BALANCE DUE: ₹ ${isPaid ? '0.00' : remainingAmt.toFixed(2)}`, 350, currentY + 43, { align: 'right' });

      // Terms & Conditions Box
      currentY += 65;
      const termsList = [
        "Terms & Conditions issued for groundwater survey services booked through Jaladhaara.",
        "Groundwater availability and borewell success depend on site-specific geological conditions & geophysical investigations and cannot be guaranteed.",
        "Please retain this invoice for future reference.",
        "Booking is confirmed upon receipt of the advance payment.",
        "Final payment is required to unlock the survey report.",
        "Travel charges are non-refundable once the expert begins the journey.",
        "Disputes must be raised within 10 days of the survey report submission."
      ];

      doc.rect(40, currentY, 515, 85).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold').text('TERMS & CONDITIONS', 50, currentY + 5);

      let termY = currentY + 16;
      termsList.forEach((term, idx) => {
        doc.fillColor(grayColor).fontSize(6.8).font('Helvetica-Bold').text(`${idx + 1}.`, 50, termY);
        doc.fillColor(textColor).font('Helvetica').text(term, 62, termY, { width: 485 });
        termY += 9.5;
      });

      // Footer
      const pageHeight = doc.page.height;
      doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold').text(`Thank you for choosing ${companyName}!`, 40, pageHeight - 48, { align: 'center' });
      doc.fillColor(grayColor).fontSize(7).font('Helvetica').text(declaration, 40, pageHeight - 36, { align: 'center' });
      doc.text(`Support: ${companyEmail} | Ph: ${companyPhone} | Website: ${companyWebsite}`, 40, pageHeight - 25, { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', async () => {
        try {
          const uploadResult = await uploadFileToCloudinary(filePath, {
            folder: 'invoices',
            resource_type: 'raw',
            format: 'pdf'
          });

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          resolve({
            success: true,
            invoiceNumber,
            invoiceUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id
          });
        } catch (error) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          reject(error);
        }
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoice
};
