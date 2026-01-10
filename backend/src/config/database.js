import { db } from './firebase.js';

export const collections = {
  USERS: 'users',
  VENDORS: 'vendors',
  SALES: 'sales',
  INVENTORY: 'inventory',
  PAYMENTS: 'payments',
  INVOICES: 'invoices',
  WHATSAPP_SETTINGS: 'whatsapp_settings'
};

export const createUser = async (userId, userData) => {
  try {
    const userRef = db.collection(collections.USERS).doc(userId);
    await userRef.set({
      ...userData,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    return { success: true, userId };
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

export const getUser = async (userId) => {
  try {
    const userRef = db.collection(collections.USERS).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return null;
    }

    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    const userRef = db.collection(collections.USERS).doc(userId);
    await userRef.update({
      ...updateData,
      lastUpdated: new Date()
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

export const addInventoryItem = async (userId, itemData, vendorId = null) => {
  try {
    const inventoryRef = db.collection(collections.INVENTORY);
    const docRef = await inventoryRef.add({
      userId,
      vendorId: vendorId || userId, // Use vendorId if provided, fallback to userId for backward compatibility
      ...itemData,
      lastUpdated: new Date(),
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    throw new Error(`Failed to add inventory item: ${error.message}`);
  }
};

export const getInventoryItems = async (vendorId) => {
  try {
    const inventoryRef = db.collection(collections.INVENTORY);
    const snapshot = await inventoryRef.where('vendorId', '==', vendorId).get();

    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });

    return items;
  } catch (error) {
    throw new Error(`Failed to get inventory items: ${error.message}`);
  }
};

export const updateInventoryItem = async (itemId, updateData) => {
  try {
    const itemRef = db.collection(collections.INVENTORY).doc(itemId);
    await itemRef.update({
      ...updateData,
      lastUpdated: new Date()
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update inventory item: ${error.message}`);
  }
};

export const deleteInventoryItem = async (itemId) => {
  try {
    const itemRef = db.collection(collections.INVENTORY).doc(itemId);
    await itemRef.delete();
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete inventory item: ${error.message}`);
  }
};

export const addPaymentReminder = async (userId, reminderData, vendorId = null) => {
  try {
    const paymentsRef = db.collection(collections.PAYMENTS);
    const docRef = await paymentsRef.add({
      userId,
      vendorId: vendorId || userId, // Use vendorId if provided, fallback to userId for backward compatibility
      ...reminderData,
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    throw new Error(`Failed to add payment reminder: ${error.message}`);
  }
};

export const getPaymentReminders = async (vendorId) => {
  try {
    const paymentsRef = db.collection(collections.PAYMENTS);
    const snapshot = await paymentsRef.where('vendorId', '==', vendorId).get();

    const reminders = [];
    snapshot.forEach(doc => {
      reminders.push({ id: doc.id, ...doc.data() });
    });

    return reminders;
  } catch (error) {
    throw new Error(`Failed to get payment reminders: ${error.message}`);
  }
};

export const updatePaymentReminder = async (reminderId, updateData) => {
  try {
    const reminderRef = db.collection(collections.PAYMENTS).doc(reminderId);
    await reminderRef.update({
      ...updateData,
      lastUpdated: new Date()
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update payment reminder: ${error.message}`);
  }
};

export const deletePaymentReminder = async (reminderId) => {
  try {
    const reminderRef = db.collection(collections.PAYMENTS).doc(reminderId);
    await reminderRef.delete();
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete payment reminder: ${error.message}`);
  }
};

export const addInvoice = async (userId, invoiceData, vendorId = null) => {
  try {
    const invoicesRef = db.collection(collections.INVOICES);
    const docRef = await invoicesRef.add({
      userId,
      vendorId: vendorId || userId, // Use vendorId if provided, fallback to userId for backward compatibility
      ...invoiceData,
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    throw new Error(`Failed to add invoice: ${error.message}`);
  }
};

export const getInvoices = async (vendorId) => {
  try {
    const invoicesRef = db.collection(collections.INVOICES);
    const snapshot = await invoicesRef.where('vendorId', '==', vendorId).get();

    const invoices = [];
    snapshot.forEach(doc => {
      invoices.push({ id: doc.id, ...doc.data() });
    });

    return invoices;
  } catch (error) {
    throw new Error(`Failed to get invoices: ${error.message}`);
  }
};

export const updateInvoice = async (invoiceId, updateData) => {
  try {
    const invoiceRef = db.collection(collections.INVOICES).doc(invoiceId);
    await invoiceRef.update({
      ...updateData,
      lastUpdated: new Date()
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update invoice: ${error.message}`);
  }
};

export const getWhatsAppSettings = async (vendorId) => {
  try {
    const settingsRef = db.collection(collections.WHATSAPP_SETTINGS).doc(vendorId);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      return {
        isConnected: false,
        autoReplyEnabled: false,
        templates: [],
        faqs: []
      };
    }

    return { id: settingsDoc.id, ...settingsDoc.data() };
  } catch (error) {
    throw new Error(`Failed to get WhatsApp settings: ${error.message}`);
  }
};

export const updateWhatsAppSettings = async (vendorId, settingsData) => {
  try {
    const settingsRef = db.collection(collections.WHATSAPP_SETTINGS).doc(vendorId);
    await settingsRef.set({
      ...settingsData,
      lastUpdated: new Date()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update WhatsApp settings: ${error.message}`);
  }
};

// ============================================
// VENDOR OPERATIONS
// ============================================

/**
 * Create a new vendor profile
 * @param {string} userId - Firebase Auth UID
 * @param {object} vendorData - Vendor information
 * @returns {Promise<{success: boolean, id: string}>}
 */
export const createVendor = async (userId, vendorData) => {
  try {
    const vendorRef = db.collection(collections.VENDORS);
    const docRef = await vendorRef.add({
      userId,
      ...vendorData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    throw new Error(`Failed to create vendor: ${error.message}`);
  }
};

/**
 * Get vendor by vendor ID
 * @param {string} vendorId - Vendor document ID
 * @returns {Promise<object|null>}
 */
export const getVendor = async (vendorId) => {
  try {
    const vendorRef = db.collection(collections.VENDORS).doc(vendorId);
    const vendorDoc = await vendorRef.get();

    if (!vendorDoc.exists) {
      return null;
    }

    return { id: vendorDoc.id, ...vendorDoc.data() };
  } catch (error) {
    throw new Error(`Failed to get vendor: ${error.message}`);
  }
};

/**
 * Get vendor by user ID (Firebase Auth UID)
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<object|null>}
 */
export const getVendorByUserId = async (userId) => {
  try {
    const vendorRef = db.collection(collections.VENDORS);
    const snapshot = await vendorRef.where('userId', '==', userId).limit(1).get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    throw new Error(`Failed to get vendor by user ID: ${error.message}`);
  }
};

/**
 * Update vendor profile
 * @param {string} vendorId - Vendor document ID
 * @param {object} updateData - Data to update
 * @returns {Promise<{success: boolean}>}
 */
export const updateVendor = async (vendorId, updateData) => {
  try {
    const vendorRef = db.collection(collections.VENDORS).doc(vendorId);
    await vendorRef.update({
      ...updateData,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to update vendor: ${error.message}`);
  }
};

// ============================================
// SALES OPERATIONS
// ============================================

/**
 * Create a new sale/transaction
 * @param {string} vendorId - Vendor ID
 * @param {object} saleData - Sale information
 * @returns {Promise<{success: boolean, id: string}>}
 */
export const createSale = async (vendorId, saleData) => {
  try {
    const salesRef = db.collection(collections.SALES);
    const docRef = await salesRef.add({
      vendorId,
      ...saleData,
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    throw new Error(`Failed to create sale: ${error.message}`);
  }
};

/**
 * Get sales for a vendor with optional filters
 * @param {string} vendorId - Vendor ID
 * @param {object} filters - Optional filters (startDate, endDate, customerId)
 * @returns {Promise<Array>}
 */
export const getSales = async (vendorId, filters = {}) => {
  try {
    let query = db.collection(collections.SALES).where('vendorId', '==', vendorId);

    // Note: We don't use orderBy in the query to avoid requiring composite indexes
    // We'll sort in memory after fetching

    // Apply date filters if provided
    if (filters.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }
    if (filters.endDate) {
      query = query.where('createdAt', '<=', new Date(filters.endDate));
    }

    // Apply customer filter if provided
    if (filters.customerId) {
      query = query.where('customerId', '==', filters.customerId);
    }

    const snapshot = await query.get();

    const sales = [];
    snapshot.forEach(doc => {
      sales.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt in descending order (newest first) in memory
    sales.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    return sales;
  } catch (error) {
    console.error('Get sales error:', error);
    throw new Error(`Failed to get sales: ${error.message}`);
  }
};

/**
 * Get sales statistics for a vendor
 * @param {string} vendorId - Vendor ID
 * @param {object} filters - Optional filters (startDate, endDate)
 * @returns {Promise<object>}
 */
export const getSaleStats = async (vendorId, filters = {}) => {
  try {
    const sales = await getSales(vendorId, filters);

    // Calculate total products sold
    const totalProductsSold = sales.reduce((total, sale) => {
      if (Array.isArray(sale.items)) {
        return total + sale.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
      }
      return total;
    }, 0);

    const stats = {
      totalSales: sales.length,
      totalOrders: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
      totalProductsSold: totalProductsSold,
      cashSales: sales.filter(s => s.paymentMethod === 'cash').length,
      upiSales: sales.filter(s => s.paymentMethod === 'upi').length,
      cardSales: sales.filter(s => s.paymentMethod === 'card').length,
      averageOrderValue: sales.length > 0
        ? sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) / sales.length
        : 0
    };

    return stats;
  } catch (error) {
    throw new Error(`Failed to get sale stats: ${error.message}`);
  }
};




