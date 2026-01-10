import express from 'express';
import {
  addInventoryItem,
  getInventoryItems,
  updateInventoryItem,
  deleteInventoryItem
} from '../config/database.js';
import { authenticateToken, requireVendor } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireVendor);

router.get('/', async (req, res) => {
  try {
    const items = await getInventoryItems(req.vendor.id);

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory',
      message: 'Unable to retrieve inventory items',
      code: 'INVENTORY_FETCH_FAILED'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, price, quantity, category, threshold } = req.body;

    if (!name || !price || !quantity) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, price, and quantity are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (price < 0 || quantity < 0) {
      return res.status(400).json({
        error: 'Invalid values',
        message: 'Price and quantity must be positive numbers',
        code: 'INVALID_VALUES'
      });
    }

    const itemData = {
      name: name.trim(),
      price: parseFloat(price),
      quantity: parseInt(quantity),
      category: category?.trim() || 'General',
      threshold: parseInt(threshold) || 10
    };

    const result = await addInventoryItem(req.user.uid, itemData, req.vendor.id);

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: { id: result.id, ...itemData }
    });
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({
      error: 'Failed to add inventory item',
      message: 'Unable to add the inventory item',
      code: 'INVENTORY_ADD_FAILED'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity, category, threshold } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'Missing item ID',
        message: 'Item ID is required',
        code: 'MISSING_ITEM_ID'
      });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({
          error: 'Invalid price',
          message: 'Price must be a positive number',
          code: 'INVALID_PRICE'
        });
      }
      updateData.price = parseFloat(price);
    }
    if (quantity !== undefined) {
      if (quantity < 0) {
        return res.status(400).json({
          error: 'Invalid quantity',
          message: 'Quantity must be a positive number',
          code: 'INVALID_QUANTITY'
        });
      }
      updateData.quantity = parseInt(quantity);
    }
    if (category !== undefined) updateData.category = category.trim();
    if (threshold !== undefined) {
      if (threshold < 0) {
        return res.status(400).json({
          error: 'Invalid threshold',
          message: 'Threshold must be a positive number',
          code: 'INVALID_THRESHOLD'
        });
      }
      updateData.threshold = parseInt(threshold);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No update data provided',
        message: 'At least one field must be provided for update',
        code: 'NO_UPDATE_DATA'
      });
    }

    await updateInventoryItem(id, updateData);

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: { id, ...updateData }
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      error: 'Failed to update inventory item',
      message: 'Unable to update the inventory item',
      code: 'INVENTORY_UPDATE_FAILED'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Missing item ID',
        message: 'Item ID is required',
        code: 'MISSING_ITEM_ID'
      });
    }

    await deleteInventoryItem(id);

    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
      data: { id }
    });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({
      error: 'Failed to delete inventory item',
      message: 'Unable to delete the inventory item',
      code: 'INVENTORY_DELETE_FAILED'
    });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const items = await getInventoryItems(req.vendor.id);
    const lowStockItems = items.filter(item => item.quantity <= item.threshold);

    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      error: 'Failed to fetch low stock items',
      message: 'Unable to retrieve low stock items',
      code: 'LOW_STOCK_FETCH_FAILED'
    });
  }
});

export default router;


