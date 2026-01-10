import express from 'express';
import {
  addPaymentReminder,
  getPaymentReminders,
  updatePaymentReminder,
  deletePaymentReminder
} from '../config/database.js';
import { authenticateToken, requireVendor } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireVendor);

router.get('/', async (req, res) => {
  try {
    const reminders = await getPaymentReminders(req.vendor.id);

    const sortedReminders = reminders.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      data: sortedReminders,
      count: sortedReminders.length
    });
  } catch (error) {
    console.error('Get payment reminders error:', error);
    res.status(500).json({
      error: 'Failed to fetch payment reminders',
      message: 'Unable to retrieve payment reminders',
      code: 'PAYMENTS_FETCH_FAILED'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { customerName, amount, dueDate, phone, originalText } = req.body;

    if (!customerName || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Customer name and amount are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number',
        code: 'INVALID_AMOUNT'
      });
    }

    const dueDateObj = dueDate ? new Date(dueDate) : new Date();
    const now = new Date();
    const status = dueDateObj < now ? 'overdue' : 'pending';

    const reminderData = {
      customerName: customerName.trim(),
      amount: parseFloat(amount),
      dueDate: dueDateObj,
      phone: phone?.trim() || '',
      status,
      originalText: originalText?.trim() || ''
    };

    const result = await addPaymentReminder(req.user.uid, reminderData, req.vendor.id);

    res.status(201).json({
      success: true,
      message: 'Payment reminder created successfully',
      data: { id: result.id, ...reminderData }
    });
  } catch (error) {
    console.error('Add payment reminder error:', error);
    res.status(500).json({
      error: 'Failed to create payment reminder',
      message: 'Unable to create the payment reminder',
      code: 'PAYMENT_REMINDER_CREATE_FAILED'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, amount, dueDate, phone, status } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'Missing reminder ID',
        message: 'Reminder ID is required',
        code: 'MISSING_REMINDER_ID'
      });
    }

    const updateData = {};

    if (customerName !== undefined) updateData.customerName = customerName.trim();
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'Amount must be a positive number',
          code: 'INVALID_AMOUNT'
        });
      }
      updateData.amount = parseFloat(amount);
    }
    if (dueDate !== undefined) {
      const dueDateObj = new Date(dueDate);
      const now = new Date();
      updateData.dueDate = dueDateObj;
      updateData.status = dueDateObj < now ? 'overdue' : 'pending';
    }
    if (phone !== undefined) updateData.phone = phone.trim();
    if (status !== undefined) {
      if (!['pending', 'overdue', 'paid'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be pending, overdue, or paid',
          code: 'INVALID_STATUS'
        });
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No update data provided',
        message: 'At least one field must be provided for update',
        code: 'NO_UPDATE_DATA'
      });
    }

    await updatePaymentReminder(id, updateData);

    res.json({
      success: true,
      message: 'Payment reminder updated successfully',
      data: { id, ...updateData }
    });
  } catch (error) {
    console.error('Update payment reminder error:', error);
    res.status(500).json({
      error: 'Failed to update payment reminder',
      message: 'Unable to update the payment reminder',
      code: 'PAYMENT_REMINDER_UPDATE_FAILED'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Missing reminder ID',
        message: 'Reminder ID is required',
        code: 'MISSING_REMINDER_ID'
      });
    }

    await deletePaymentReminder(id);

    res.json({
      success: true,
      message: 'Payment reminder deleted successfully',
      data: { id }
    });
  } catch (error) {
    console.error('Delete payment reminder error:', error);
    res.status(500).json({
      error: 'Failed to delete payment reminder',
      message: 'Unable to delete the payment reminder',
      code: 'PAYMENT_REMINDER_DELETE_FAILED'
    });
  }
});

router.put('/:id/mark-paid', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Missing reminder ID',
        message: 'Reminder ID is required',
        code: 'MISSING_REMINDER_ID'
      });
    }

    await updatePaymentReminder(id, { status: 'paid' });

    res.json({
      success: true,
      message: 'Payment reminder marked as paid',
      data: { id, status: 'paid' }
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({
      error: 'Failed to mark payment as paid',
      message: 'Unable to update payment status',
      code: 'MARK_PAID_FAILED'
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const reminders = await getPaymentReminders(req.vendor.id);

    const stats = {
      total: reminders.length,
      pending: reminders.filter(r => r.status === 'pending').length,
      overdue: reminders.filter(r => r.status === 'overdue').length,
      paid: reminders.filter(r => r.status === 'paid').length,
      totalAmount: reminders.reduce((sum, r) => sum + r.amount, 0),
      pendingAmount: reminders
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.amount, 0),
      overdueAmount: reminders
        .filter(r => r.status === 'overdue')
        .reduce((sum, r) => sum + r.amount, 0)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch payment statistics',
      message: 'Unable to retrieve payment statistics',
      code: 'PAYMENT_STATS_FETCH_FAILED'
    });
  }
});

router.post('/send-reminder', async (req, res) => {
  try {
    const { reminderId, message } = req.body;

    if (!reminderId) {
      return res.status(400).json({
        error: 'Missing reminder ID',
        message: 'Reminder ID is required',
        code: 'MISSING_REMINDER_ID'
      });
    }

    // TODO: Integrate with WhatsApp service
    // For now, just update the reminder status
    await updatePaymentReminder(reminderId, {
      lastReminderSent: new Date()
    });

    res.json({
      success: true,
      message: 'Payment reminder sent successfully',
      data: { id: reminderId }
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      error: 'Failed to send payment reminder',
      message: 'Unable to send the payment reminder',
      code: 'SEND_REMINDER_FAILED'
    });
  }
});

router.post('/bulk-reminder', async (req, res) => {
  try {
    const { reminderIds, message } = req.body;

    if (!reminderIds || !Array.isArray(reminderIds) || reminderIds.length === 0) {
      return res.status(400).json({
        error: 'Missing reminder IDs',
        message: 'At least one reminder ID is required',
        code: 'MISSING_REMINDER_IDS'
      });
    }

    // TODO: Integrate with WhatsApp service for bulk sending
    // For now, just update all reminders
    const updatePromises = reminderIds.map(id =>
      updatePaymentReminder(id, {
        lastReminderSent: new Date()
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `${reminderIds.length} payment reminders sent successfully`,
      data: { count: reminderIds.length }
    });
  } catch (error) {
    console.error('Bulk reminder error:', error);
    res.status(500).json({
      error: 'Failed to send bulk reminders',
      message: 'Unable to send payment reminders',
      code: 'BULK_REMINDER_FAILED'
    });
  }
});

export default router;


