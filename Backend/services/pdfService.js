const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { uploadFileToCloudinary } = require('./cloudinaryService');

/**
 * Generate Marketplace Tax Invoice PDF for booking
 * @param {Object} booking - Booking object with populated user, vendor, service
 * @returns {Promise<Object>} Invoice details with URL
 */
const generateInvoice = async (booking) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const dateStr = new Date(booking.payment?.createdAt || booking.createdAt).toISOString().slice(0,10).replace(/-/g,'');
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
      doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('JALADHAARA', 40, 40);
      doc.fillColor(grayColor).fontSize(8).font('Helvetica').text('GROUNDWATER & HYDROGEOLOGICAL SERVICES', 40, 63);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('TAX INVOICE / PAYMENT RECEIPT', 40, 78);

      // Header Right: Company Info
      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold').text('Jaladhaara Hydrogeological Services Pvt. Ltd.', 300, 40, { align: 'right' });
      doc.fillColor(grayColor).fontSize(8).font('Helvetica').text('Plot No. 42, Hitech City Main Road, Madhapur', 300, 52, { align: 'right' });
      doc.text('Hyderabad, Telangana - 500081, India', 300, 63, { align: 'right' });
      doc.fillColor(primaryColor).font('Helvetica-Bold').text('GSTIN: 36AAACJ1234F1Z5', 300, 74, { align: 'right' });
      doc.fillColor(grayColor).font('Helvetica').text('PAN: AAACJ1234F | Ph: +91 91234 56789', 300, 85, { align: 'right' });

      // Divider
      doc.moveTo(40, 105).lineTo(555, 105).strokeColor('#E5E7EB').lineWidth(1).stroke();

      // Invoice Details Bar
      let currentY = 115;
      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold').text(`Invoice No: ${invoiceNumber}`, 40, currentY);
      doc.text(`Order ID: ORD-${booking._id.toString().slice(-8).toUpperCase()}`, 220, currentY);
      const isPaid = booking.payment?.remainingPaid;
      doc.fillColor(isPaid ? '#059669' : '#D97706').text(`Status: ${isPaid ? 'PAID IN FULL' : 'PARTIALLY PAID'}`, 430, currentY, { align: 'right' });

      currentY += 14;
      doc.fillColor(grayColor).fontSize(8).font('Helvetica').text(`Date & Time: ${new Date(booking.payment?.createdAt || booking.createdAt).toLocaleString('en-IN')}`, 40, currentY);
      const txnRef = booking.payment?.advanceRazorpayPaymentId || booking.payment?.remainingRazorpayPaymentId || 'ONLINE_PAYMENT';
      doc.text(`Transaction Ref: ${txnRef}`, 220, currentY);

      // Customer & Service Section Box
      currentY += 20;
      doc.rect(40, currentY, 515, 80).fillAndStroke('#F9FAFB', '#F3F4F6');

      // Customer Column (Left)
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text('CUSTOMER DETAILS (BILLED TO)', 50, currentY + 8);
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text(booking.user?.name || 'Customer', 50, currentY + 20);
      doc.fillColor(grayColor).fontSize(8).font('Helvetica').text(`Ph: ${booking.user?.phone || 'N/A'} | Email: ${booking.user?.email || 'N/A'}`, 50, currentY + 34);
      if (booking.address) {
        const addr = `${booking.address.street || ''}, ${booking.address.city || ''}, ${booking.address.state || ''} - ${booking.address.pincode || ''}`;
        doc.text(`Address: ${addr.slice(0, 55)}`, 50, currentY + 46);
      }

      // Expert & Service Column (Right)
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text('ASSIGNED EXPERT & SERVICE', 310, currentY + 8);
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold').text(booking.vendor?.name || 'Assigned Expert', 310, currentY + 20);
      doc.fillColor(grayColor).fontSize(8).font('Helvetica').text(`Service: ${booking.service?.name || 'Groundwater Survey'}`, 310, currentY + 34);
      doc.text(`Machine: ${booking.service?.machineType || 'Resistivity / ADMT / PQWT'}`, 310, currentY + 46);
      doc.text(`Scheduled Visit: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN')}`, 310, currentY + 58);

      // Items Table Header
      currentY += 95;
      doc.rect(40, currentY, 515, 20).fill('#0A84FF');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('ITEM / SERVICE DESCRIPTION', 50, currentY + 6);
      doc.text('QTY', 320, currentY + 6, { width: 30, align: 'center' });
      doc.text('UNIT PRICE (₹)', 360, currentY + 6, { width: 80, align: 'right' });
      doc.text('TOTAL (₹)', 460, currentY + 6, { width: 85, align: 'right' });

      // Table Row - Base Service
      currentY += 20;
      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold');
      const baseFee = booking.payment?.baseServiceFee || booking.service?.price || 0;
      doc.text(booking.service?.name || 'Groundwater Hydrogeological Survey', 50, currentY + 6);
      doc.fontSize(7.5).font('Helvetica').fillColor(grayColor).text(`Professional survey & report (${booking.service?.machineType || 'Standard Machine'})`, 50, currentY + 18);
      
      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold');
      doc.text('1', 320, currentY + 6, { width: 30, align: 'center' });
      doc.text(baseFee.toFixed(2), 360, currentY + 6, { width: 80, align: 'right' });
      doc.text(baseFee.toFixed(2), 460, currentY + 6, { width: 85, align: 'right' });

      currentY += 32;

      // Table Row - Travel Charges if applicable
      const travelCharges = booking.payment?.travelCharges || 0;
      if (travelCharges > 0) {
        doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold');
        doc.text('Travel & Mobilization Charges', 50, currentY + 4);
        doc.fontSize(7.5).font('Helvetica').fillColor(grayColor).text(`Round trip calculated for ${booking.payment?.distance?.toFixed(1) || '0'} km`, 50, currentY + 16);
        
        doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold');
        doc.text('1', 320, currentY + 4, { width: 30, align: 'center' });
        doc.text(travelCharges.toFixed(2), 360, currentY + 4, { width: 80, align: 'right' });
        doc.text(travelCharges.toFixed(2), 460, currentY + 4, { width: 85, align: 'right' });
        currentY += 30;
      }

      // Summary Block (Right aligned)
      currentY += 10;
      const gstTotal = booking.payment?.gst || (baseFee * 0.18);
      const cgst = gstTotal / 2;
      const sgst = gstTotal / 2;
      const grandTotal = booking.payment?.totalAmount || (baseFee + gstTotal + travelCharges);

      const summaryX = 350;
      doc.fillColor(grayColor).fontSize(8).font('Helvetica');
      doc.text('Base Service Fee:', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${baseFee.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 14;
      doc.fillColor(grayColor).font('Helvetica').text('Taxable Amount:', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${(baseFee + travelCharges).toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 14;
      doc.fillColor(grayColor).font('Helvetica').text('CGST (9%):', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${cgst.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 14;
      doc.fillColor(grayColor).font('Helvetica').text('SGST (9%):', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${sgst.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 14;
      doc.fillColor(grayColor).font('Helvetica').text('Total GST (18%):', summaryX, currentY);
      doc.fillColor(textColor).font('Helvetica-Bold').text(`₹ ${gstTotal.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });

      currentY += 18;
      doc.rect(340, currentY - 4, 215, 24).fill('#0A84FF');
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold');
      doc.text('GRAND TOTAL:', 350, currentY + 2);
      doc.text(`₹ ${grandTotal.toFixed(2)}`, 450, currentY + 2, { width: 95, align: 'right' });

      // Payment History Box
      currentY += 40;
      doc.rect(40, currentY, 515, 45).fillAndStroke('#F9FAFB', '#F3F4F6');
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text('PAYMENT RECEIPTS & BREAKDOWN', 50, currentY + 6);
      
      const advance = booking.payment?.advanceAmount || 0;
      const remaining = booking.payment?.remainingAmount || 0;
      
      doc.fillColor(grayColor).fontSize(8).font('Helvetica');
      doc.text(`Advance Payment (40%): ₹ ${advance.toFixed(2)} (PAID)`, 50, currentY + 20);
      doc.text(`Remaining Payment (60%): ₹ ${remaining.toFixed(2)} (${isPaid ? 'PAID' : 'PENDING'})`, 50, currentY + 32);

      doc.fillColor(textColor).font('Helvetica-Bold');
      doc.text(`BALANCE DUE: ₹ ${isPaid ? '0.00' : remaining.toFixed(2)}`, 350, currentY + 20, { align: 'right' });

      // Footer
      const pageHeight = doc.page.height;
      doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold').text('Thank you for choosing Jaladhaara!', 40, pageHeight - 50, { align: 'center' });
      doc.fillColor(grayColor).fontSize(7).font('Helvetica').text('This is a system-generated invoice and does not require a physical signature.', 40, pageHeight - 38, { align: 'center' });
      doc.text('Support: support@jaladhaaraapp.in | Ph: +91 91234 56789 | Website: https://jaladhaaraapp.in', 40, pageHeight - 26, { align: 'center' });

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
