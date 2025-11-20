const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { uploadFileToCloudinary } = require('./cloudinaryService');

/**
 * Generate PDF invoice for booking
 * @param {Object} booking - Booking object with populated user, vendor, service
 * @returns {Promise<Object>} Invoice details with URL
 */
const generateInvoice = async (booking) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const invoiceNumber = `INV-${booking._id.toString().slice(-8).toUpperCase()}-${Date.now()}`;
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

      // Header
      doc.fontSize(20).text('JALADHAR', 50, 50, { align: 'center' });
      doc.fontSize(12).text('Water Detection Service Invoice', 50, 75, { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(10);
      doc.text(`Invoice Number: ${invoiceNumber}`, 50, 120);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 50, 135);
      doc.text(`Booking ID: ${booking._id.toString()}`, 50, 150);

      // User details
      doc.fontSize(12).text('Bill To:', 50, 180);
      doc.fontSize(10);
      doc.text(`Name: ${booking.user.name}`, 50, 200);
      doc.text(`Email: ${booking.user.email}`, 50, 215);
      doc.text(`Phone: ${booking.user.phone}`, 50, 230);
      if (booking.address) {
        doc.text(`Address: ${booking.address.street}, ${booking.address.city}`, 50, 245);
        doc.text(`${booking.address.state} - ${booking.address.pincode}`, 50, 260);
      }

      // Vendor details
      doc.fontSize(12).text('Service Provider:', 350, 180);
      doc.fontSize(10);
      doc.text(`Name: ${booking.vendor.name}`, 350, 200);
      doc.text(`Email: ${booking.vendor.email}`, 350, 215);
      doc.text(`Phone: ${booking.vendor.phone}`, 350, 230);

      // Service details
      doc.fontSize(12).text('Service Details:', 50, 300);
      doc.fontSize(10);
      doc.text(`Service: ${booking.service.name}`, 50, 320);
      doc.text(`Machine Type: ${booking.service.machineType || 'N/A'}`, 50, 335);
      doc.text(`Scheduled Date: ${new Date(booking.scheduledDate).toLocaleDateString('en-IN')}`, 50, 350);
      doc.text(`Scheduled Time: ${booking.scheduledTime}`, 50, 365);

      // Payment breakdown
      doc.fontSize(12).text('Payment Breakdown:', 50, 400);
      doc.fontSize(10);
      
      const tableTop = 420;
      const itemHeight = 20;
      let currentY = tableTop;

      // Table header
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, currentY);
      doc.text('Amount (₹)', 450, currentY);
      currentY += itemHeight;

      doc.font('Helvetica');
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 10;

      // Service amount
      doc.text('Service Charge', 50, currentY);
      doc.text(booking.payment.totalAmount.toFixed(2), 450, currentY);
      currentY += itemHeight;

      // Advance payment
      doc.text('Advance Payment (40%)', 50, currentY);
      doc.text(booking.payment.advanceAmount.toFixed(2), 450, currentY);
      currentY += itemHeight;

      // Remaining payment
      doc.text('Remaining Payment (60%)', 50, currentY);
      doc.text(booking.payment.remainingAmount.toFixed(2), 450, currentY);
      currentY += itemHeight;

      // GST (18%)
      const gstAmount = (booking.payment.totalAmount * 0.18).toFixed(2);
      doc.text('GST (18%)', 50, currentY);
      doc.text(gstAmount, 450, currentY);
      currentY += itemHeight;

      // Total
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 10;
      doc.font('Helvetica-Bold');
      const totalWithGST = (booking.payment.totalAmount * 1.18).toFixed(2);
      doc.text('Total Amount (Including GST)', 50, currentY);
      doc.text(`₹ ${totalWithGST}`, 450, currentY);

      // Payment status
      currentY += 30;
      doc.font('Helvetica');
      doc.text('Payment Status:', 50, currentY);
      doc.font('Helvetica-Bold');
      doc.text(booking.payment.status, 200, currentY);

      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(8);
      doc.text('Thank you for choosing Jaladhar!', 50, pageHeight - 50, { align: 'center' });
      doc.text('For queries, contact: support@jaladhar.com', 50, pageHeight - 35, { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', async () => {
        try {
          // Upload to Cloudinary
          const uploadResult = await uploadFileToCloudinary(filePath, {
            folder: 'invoices',
            resource_type: 'raw',
            format: 'pdf'
          });

          // Delete local file
          fs.unlinkSync(filePath);

          resolve({
            success: true,
            invoiceNumber,
            invoiceUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id
          });
        } catch (error) {
          // Clean up local file even if upload fails
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

