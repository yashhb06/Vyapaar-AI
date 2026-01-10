import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generate an invoice PDF
 * @param {object} invoice - Invoice data
 * @param {object} vendor - Vendor information
 * @param {string} outputPath - Path to save the PDF
 * @returns {Promise<string>} Path to the generated PDF
 */
export const generateInvoicePDF = async (invoice, vendor, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Header
            doc.fontSize(20).text(vendor.shopName || 'Invoice', { align: 'center' });
            doc.moveDown(0.5);

            // Vendor Details
            doc.fontSize(10);
            if (vendor.ownerName) doc.text(`Owner: ${vendor.ownerName}`);
            if (vendor.address) doc.text(`Address: ${typeof vendor.address === 'string' ? vendor.address : JSON.stringify(vendor.address)}`);
            if (vendor.phoneNumber) doc.text(`Phone: ${vendor.phoneNumber}`);
            if (vendor.email) doc.text(`Email: ${vendor.email}`);
            if (vendor.gstNumber) doc.text(`GST No: ${vendor.gstNumber}`);

            doc.moveDown(1);

            // Invoice Details
            doc.fontSize(12).text(`Invoice #${invoice.invoiceNumber || invoice.id}`, { align: 'right' });
            doc.fontSize(10);
            doc.text(`Date: ${new Date(invoice.date || invoice.createdAt).toLocaleDateString()}`, { align: 'right' });
            if (invoice.dueDate) {
                doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, { align: 'right' });
            }

            doc.moveDown(1);

            // Customer Details
            doc.text(`Bill To: ${invoice.customerName || 'Walk-in Customer'}`);
            if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`);

            doc.moveDown(1);

            // Items Table
            const tableTop = doc.y;
            const itemX = 50;
            const descX = 150;
            const qtyX = 350;
            const priceX = 420;
            const totalX = 490;

            // Table Headers
            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('#', itemX, tableTop);
            doc.text('Description', descX, tableTop);
            doc.text('Qty', qtyX, tableTop);
            doc.text('Price', priceX, tableTop);
            doc.text('Total', totalX, tableTop);

            doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

            // Table Rows
            doc.font('Helvetica').fontSize(10);
            let y = tableTop + 30;

            (invoice.items || []).forEach((item, index) => {
                doc.text(index + 1, itemX, y);
                doc.text(item.name || '', descX, y, { width: 180 });
                doc.text(item.quantity || 0, qtyX, y);
                doc.text(`₹${(item.price || 0).toFixed(2)}`, priceX, y);
                doc.text(`₹${(item.total || 0).toFixed(2)}`, totalX, y);
                y += 25;
            });

            // Line above totals
            doc.moveTo(50, y).lineTo(550, y).stroke();
            y += 10;

            // Totals
            doc.fontSize(11).font('Helvetica');

            if (invoice.amount) {
                doc.text('Subtotal:', priceX, y);
                doc.text(`₹${invoice.amount.toFixed(2)}`, totalX, y);
                y += 20;
            }

            if (invoice.gst) {
                doc.text('GST:', priceX, y);
                doc.text(`₹${invoice.gst.toFixed(2)}`, totalX, y);
                y += 20;
            }

            if (invoice.discount) {
                doc.text('Discount:', priceX, y);
                doc.text(`-₹${invoice.discount.toFixed(2)}`, totalX, y);
                y += 20;
            }

            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('Total:', priceX, y);
            doc.text(`₹${(invoice.totalAmount || 0).toFixed(2)}`, totalX, y);

            // Footer
            y += 50;
            if (vendor.upiId) {
                doc.fontSize(10).font('Helvetica');
                doc.moveDown(2);
                doc.text(`Payment via UPI: ${vendor.upiId}`, { align: 'center' });
            }

            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate a simple sales receipt
 * @param {object} sale - Sale data
 * @param {object} vendor - Vendor information
 * @param {string} outputPath - Path to save the PDF
 * @returns {Promise<string>} Path to the generated PDF
 */
export const generateReceiptPDF = async (sale, vendor, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: [227, 595] }); // Thermal receipt size
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Header
            doc.fontSize(14).text(vendor.shopName || 'Receipt', { align: 'center' });
            doc.fontSize(8);
            if (vendor.phoneNumber) doc.text(`Ph: ${vendor.phoneNumber}`, { align: 'center' });
            if (vendor.address) doc.text(typeof vendor.address === 'string' ? vendor.address : JSON.stringify(vendor.address), { align: 'center' });

            doc.moveDown(0.5);
            doc.text('-'.repeat(40), { align: 'center' });
            doc.moveDown(0.5);

            // Sale Details
            doc.text(`Date: ${new Date(sale.saleDate || sale.createdAt).toLocaleString()}`);
            doc.text(`Customer: ${sale.customerName || 'Walk-in'}`);
            doc.moveDown(0.5);

            // Items
            (sale.items || []).forEach((item) => {
                doc.text(`${item.name} x${item.quantity}`, 50);
                doc.text(`₹${(item.total || 0).toFixed(2)}`, 150, doc.y - 10);
            });

            doc.moveDown(0.5);
            doc.text('-'.repeat(40), { align: 'center' });

            // Total
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('TOTAL:', 50);
            doc.text(`₹${(sale.totalAmount || 0).toFixed(2)}`, 150, doc.y - 10);

            doc.fontSize(8).font('Helvetica');
            doc.text(`Payment: ${sale.paymentMethod || 'cash'}`.toUpperCase());

            doc.moveDown(1);
            doc.text('Thank you for your business!', { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};
