import express from 'express';
import { createSale, getSales, getSaleStats } from '../config/database.js';
import { authenticateToken, requireVendor } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireVendor);

router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, customerId } = req.query;

        const filters = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (customerId) filters.customerId = customerId;

        const sales = await getSales(req.vendor.id, filters);

        const sortedSales = sales.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({
            success: true,
            data: sortedSales,
            count: sortedSales.length
        });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({
            error: 'Failed to fetch sales',
            message: 'Unable to retrieve sales',
            code: 'SALES_FETCH_FAILED'
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            customerName,
            customerId,
            items,
            paymentMethod,
            totalAmount,
            discount,
            notes
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Items are required',
                code: 'MISSING_FIELDS'
            });
        }

        if (totalAmount < 0) {
            return res.status(400).json({
                error: 'Invalid total amount',
                message: 'Total amount must be a positive number',
                code: 'INVALID_TOTAL_AMOUNT'
            });
        }

        const saleData = {
            customerName: customerName?.trim() || 'Walk-in Customer',
            customerId: customerId?.trim() || null,
            items: items.map(item => ({
                name: item.name?.trim() || '',
                quantity: parseInt(item.quantity) || 0,
                price: parseFloat(item.price) || 0,
                total: parseFloat(item.total) || (parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)
            })),
            paymentMethod: paymentMethod || 'cash',
            totalAmount: parseFloat(totalAmount),
            discount: parseFloat(discount) || 0,
            notes: notes?.trim() || '',
            saleDate: new Date()
        };

        const result = await createSale(req.vendor.id, saleData);

        res.status(201).json({
            success: true,
            message: 'Sale created successfully',
            data: { id: result.id, ...saleData }
        });
    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({
            error: 'Failed to create sale',
            message: 'Unable to create the sale',
            code: 'SALE_CREATE_FAILED'
        });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filters = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const stats = await getSaleStats(req.vendor.id, filters);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get sales stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch sales statistics',
            message: 'Unable to retrieve sales statistics',
            code: 'SALES_STATS_FETCH_FAILED'
        });
    }
});

export default router;
