import express from 'express';
import {
    getVendor,
    updateVendor,
    getSaleStats
} from '../config/database.js';
import { authenticateToken, requireVendor } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireVendor);

router.get('/profile', async (req, res) => {
    try {
        const vendor = await getVendor(req.vendor.id);

        if (!vendor) {
            return res.status(404).json({
                error: 'Vendor not found',
                message: 'Vendor profile not found',
                code: 'VENDOR_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: vendor
        });
    } catch (error) {
        console.error('Get vendor profile error:', error);
        res.status(500).json({
            error: 'Failed to fetch vendor profile',
            message: 'Unable to retrieve vendor profile',
            code: 'VENDOR_PROFILE_FETCH_FAILED'
        });
    }
});

router.put('/profile', async (req, res) => {
    try {
        const {
            shopName,
            ownerName,
            phoneNumber,
            whatsappNumber,
            email,
            gstNumber,
            upiId,
            address,
            preferredLanguage,
            businessType
        } = req.body;

        const updateData = {};

        if (shopName !== undefined) updateData.shopName = shopName.trim();
        if (ownerName !== undefined) updateData.ownerName = ownerName.trim();
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
        if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber.trim();
        if (email !== undefined) updateData.email = email.trim();
        if (gstNumber !== undefined) updateData.gstNumber = gstNumber.trim();
        if (upiId !== undefined) updateData.upiId = upiId.trim();
        if (address !== undefined) updateData.address = address;
        if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;
        if (businessType !== undefined) updateData.businessType = businessType;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No update data provided',
                message: 'At least one field must be provided for update',
                code: 'NO_UPDATE_DATA'
            });
        }

        await updateVendor(req.vendor.id, updateData);

        res.json({
            success: true,
            message: 'Vendor profile updated successfully',
            data: updateData
        });
    } catch (error) {
        console.error('Update vendor profile error:', error);
        res.status(500).json({
            error: 'Failed to update vendor profile',
            message: 'Unable to update vendor profile',
            code: 'VENDOR_PROFILE_UPDATE_FAILED'
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
        console.error('Get vendor stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch vendor statistics',
            message: 'Unable to retrieve vendor statistics',
            code: 'VENDOR_STATS_FETCH_FAILED'
        });
    }
});

export default router;
