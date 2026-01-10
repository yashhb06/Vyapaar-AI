import express from 'express';
import {
  getInventoryItems,
  getPaymentReminders,
  getInvoices,
  getSales
} from '../config/database.js';
import { authenticateToken, requireVendor } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireVendor);

router.get('/stats', async (req, res) => {
  try {
    const [inventoryItems, paymentReminders, invoices, sales] = await Promise.all([
      getInventoryItems(req.vendor.id),
      getPaymentReminders(req.vendor.id),
      getInvoices(req.vendor.id),
      getSales(req.vendor.id) // ADD SALES DATA
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter today's sales using saleDate field
    const todaySales = sales.filter(sale => {
      const saleDate = sale.saleDate?.toDate ? sale.saleDate.toDate() : new Date(sale.saleDate);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    // Filter this week's sales
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekSales = sales.filter(sale => {
      const saleDate = sale.saleDate?.toDate ? sale.saleDate.toDate() : new Date(sale.saleDate);
      return saleDate >= weekAgo;
    });

    const lowStockItems = inventoryItems.filter(item => item.quantity <= item.threshold);

    const pendingPayments = paymentReminders.filter(reminder =>
      reminder.status === 'pending' || reminder.status === 'overdue'
    );

    const todaySalesValue = todaySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const thisWeekSalesValue = thisWeekSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const pendingPaymentsAmount = pendingPayments.reduce((sum, reminder) => sum + reminder.amount, 0);

    const stats = {
      todaySales: {
        value: todaySalesValue,
        transactions: todaySales.length,
        change: '+12%'
      },
      thisWeekSales: {
        value: thisWeekSalesValue,
        transactions: thisWeekSales.length,
        change: '+8%'
      },
      pendingPayments: {
        value: pendingPaymentsAmount,
        count: pendingPayments.length,
        change: `${pendingPayments.length} customers`
      },
      lowStockItems: {
        count: lowStockItems.length,
        items: lowStockItems.slice(0, 5).map(item => ({
          name: item.name,
          quantity: item.quantity,
          threshold: item.threshold
        }))
      },
      totalInventory: {
        count: inventoryItems.length,
        value: inventoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      },
      recentActivity: [
        ...todaySales.slice(0, 3).map(sale => ({
          type: 'sale',
          customer: sale.customerName,
          amount: `₹${(sale.totalAmount || 0).toLocaleString()}`,
          time: 'Today'
        })),
        ...paymentReminders.slice(0, 2).map(reminder => ({
          type: 'reminder',
          customer: reminder.customerName,
          amount: `₹${reminder.amount.toLocaleString()}`,
          time: 'Recent'
        }))
      ].slice(0, 5)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: 'Unable to retrieve dashboard data',
      code: 'DASHBOARD_STATS_FETCH_FAILED'
    });
  }
});

router.get('/insights', async (req, res) => {
  try {
    const [inventoryItems, paymentReminders, invoices] = await Promise.all([
      getInventoryItems(req.vendor.id),
      getPaymentReminders(req.vendor.id),
      getInvoices(req.vendor.id)
    ]);

    const insights = [];

    const lowStockItems = inventoryItems.filter(item => item.quantity <= item.threshold);
    if (lowStockItems.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Stock Alert',
        message: `${lowStockItems.length} products are running low and need restocking`,
        priority: 'high',
        items: lowStockItems.slice(0, 3).map(item => item.name)
      });
    }

    const overduePayments = paymentReminders.filter(reminder => reminder.status === 'overdue');
    if (overduePayments.length > 0) {
      const totalOverdue = overduePayments.reduce((sum, reminder) => sum + reminder.amount, 0);
      insights.push({
        type: 'info',
        title: 'Payment Reminder',
        message: `${overduePayments.length} customers have overdue payments totaling ₹${totalOverdue.toLocaleString()}`,
        priority: 'medium',
        amount: totalOverdue
      });
    }

    const recentInvoices = invoices
      .filter(invoice => invoice.status === 'Paid')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7);

    if (recentInvoices.length >= 3) {
      const avgDailySales = recentInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0) / 7;
      insights.push({
        type: 'success',
        title: 'Sales Performance',
        message: `Your average daily sales are ₹${avgDailySales.toFixed(0)}. Keep up the good work!`,
        priority: 'low',
        trend: 'up'
      });
    }

    const topSellingItems = inventoryItems
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    if (topSellingItems.length > 0) {
      insights.push({
        type: 'info',
        title: 'Top Products',
        message: `Your best-selling items are: ${topSellingItems.map(item => item.name).join(', ')}`,
        priority: 'low',
        items: topSellingItems.map(item => item.name)
      });
    }

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Get dashboard insights error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard insights',
      message: 'Unable to retrieve business insights',
      code: 'DASHBOARD_INSIGHTS_FETCH_FAILED'
    });
  }
});

export default router;


