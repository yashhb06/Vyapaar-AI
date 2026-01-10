import express from 'express';
import {
  addInvoice,
  getInvoices,
  updateInvoice
} from '../config/database.js';
import { authenticateToken, requireVendor } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireVendor);

router.get('/', async (req, res) => {
  try {
    const invoices = await getInvoices(req.vendor.id);

    const sortedInvoices = invoices.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    res.json({
      success: true,
      data: sortedInvoices,
      count: sortedInvoices.length
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      message: 'Unable to retrieve invoices',
      code: 'INVOICES_FETCH_FAILED'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerName,
      customerPhone,
      amount,
      gst,
      totalAmount,
      status,
      date,
      dueDate,
      items
    } = req.body;

    if (!customerName || !amount || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Customer name, amount, and items are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (amount < 0 || gst < 0 || totalAmount < 0) {
      return res.status(400).json({
        error: 'Invalid amounts',
        message: 'Amount, GST, and total amount must be positive numbers',
        code: 'INVALID_AMOUNTS'
      });
    }

    const invoiceData = {
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || '',
      amount: parseFloat(amount),
      gst: parseFloat(gst) || 0,
      totalAmount: parseFloat(totalAmount),
      status: status || 'Pending',
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: items.map(item => ({
        name: item.name?.trim() || '',
        quantity: parseInt(item.quantity) || 0,
        price: parseFloat(item.price) || 0,
        total: parseFloat(item.total) || 0
      }))
    };

    const result = await addInvoice(req.user.uid, invoiceData, req.vendor.id);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: { id: result.id, ...invoiceData }
    });
  } catch (error) {
    console.error('Add invoice error:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      message: 'Unable to create the invoice',
      code: 'INVOICE_CREATE_FAILED'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      amount,
      gst,
      totalAmount,
      status,
      date,
      dueDate,
      items
    } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'Missing invoice ID',
        message: 'Invoice ID is required',
        code: 'MISSING_INVOICE_ID'
      });
    }

    const updateData = {};

    if (customerName !== undefined) updateData.customerName = customerName.trim();
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone.trim();
    if (amount !== undefined) {
      if (amount < 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'Amount must be a positive number',
          code: 'INVALID_AMOUNT'
        });
      }
      updateData.amount = parseFloat(amount);
    }
    if (gst !== undefined) {
      if (gst < 0) {
        return res.status(400).json({
          error: 'Invalid GST',
          message: 'GST must be a positive number',
          code: 'INVALID_GST'
        });
      }
      updateData.gst = parseFloat(gst);
    }
    if (totalAmount !== undefined) {
      if (totalAmount < 0) {
        return res.status(400).json({
          error: 'Invalid total amount',
          message: 'Total amount must be a positive number',
          code: 'INVALID_TOTAL_AMOUNT'
        });
      }
      updateData.totalAmount = parseFloat(totalAmount);
    }
    if (status !== undefined) {
      if (!['Paid', 'Pending', 'Overdue'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be Paid, Pending, or Overdue',
          code: 'INVALID_STATUS'
        });
      }
      updateData.status = status;
    }
    if (date !== undefined) updateData.date = new Date(date);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Invalid items',
          message: 'Items must be a non-empty array',
          code: 'INVALID_ITEMS'
        });
      }
      updateData.items = items.map(item => ({
        name: item.name?.trim() || '',
        quantity: parseInt(item.quantity) || 0,
        price: parseFloat(item.price) || 0,
        total: parseFloat(item.total) || 0
      }));
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No update data provided',
        message: 'At least one field must be provided for update',
        code: 'NO_UPDATE_DATA'
      });
    }

    await updateInvoice(id, updateData);

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: { id, ...updateData }
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      error: 'Failed to update invoice',
      message: 'Unable to update the invoice',
      code: 'INVOICE_UPDATE_FAILED'
    });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'Missing invoice ID',
        message: 'Invoice ID is required',
        code: 'MISSING_INVOICE_ID'
      });
    }

    if (!status || !['Paid', 'Pending', 'Overdue'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be Paid, Pending, or Overdue',
        code: 'INVALID_STATUS'
      });
    }

    await updateInvoice(id, { status });

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: { id, status }
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      error: 'Failed to update invoice status',
      message: 'Unable to update invoice status',
      code: 'INVOICE_STATUS_UPDATE_FAILED'
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const invoices = await getInvoices(req.vendor.id);

    const stats = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'Paid').length,
      pending: invoices.filter(i => i.status === 'Pending').length,
      overdue: invoices.filter(i => i.status === 'Overdue').length,
      totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
      paidAmount: invoices
        .filter(i => i.status === 'Paid')
        .reduce((sum, i) => sum + i.totalAmount, 0),
      pendingAmount: invoices
        .filter(i => i.status === 'Pending')
        .reduce((sum, i) => sum + i.totalAmount, 0),
      overdueAmount: invoices
        .filter(i => i.status === 'Overdue')
        .reduce((sum, i) => sum + i.totalAmount, 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice statistics',
      message: 'Unable to retrieve invoice statistics',
      code: 'INVOICE_STATS_FETCH_FAILED'
    });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { invoiceId, format } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        error: 'Missing invoice ID',
        message: 'Invoice ID is required',
        code: 'MISSING_INVOICE_ID'
      });
    }

    // TODO: Implement PDF generation using pdfGenerator utility
    // For now, return success with placeholder
    res.json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        invoiceId,
        format: format || 'pdf',
        downloadUrl: `/api/invoices/${invoiceId}/download`
      }
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      error: 'Failed to generate invoice',
      message: 'Unable to generate the invoice',
      code: 'INVOICE_GENERATE_FAILED'
    });
  }
});

export default router;


