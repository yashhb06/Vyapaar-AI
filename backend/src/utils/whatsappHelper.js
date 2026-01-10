/**
 * WhatsApp Helper Utility
 * Functions for formatting WhatsApp messages and templates
 */

/**
 * Format a payment reminder message
 * @param {object} reminder - Payment reminder data
 * @param {object} vendor - Vendor information
 * @param {string} language - Language code ('en' or 'hi')
 * @returns {string} Formatted message
 */
export const formatPaymentReminderMessage = (reminder, vendor, language = 'en') => {
    const templates = {
        en: {
            greeting: `Hello ${reminder.customerName},`,
            body: `This is a friendly reminder from *${vendor.shopName}*.`,
            amount: `You have a pending payment of *₹${reminder.amount}*`,
            dueDate: reminder.dueDate ? `due on *${new Date(reminder.dueDate).toLocaleDateString()}*.` : '.',
            payment: vendor.upiId ? `\n\nYou can pay via UPI: *${vendor.upiId}*` : '',
            contact: `\n\nFor any queries, please contact us at ${vendor.phoneNumber}`,
            closing: '\n\nThank you!'
        },
        hi: {
            greeting: `नमस्ते ${reminder.customerName},`,
            body: `यह *${vendor.shopName}* की ओर से एक अनुस्मारक है।`,
            amount: `आपका बकाया भुगतान *₹${reminder.amount}* है`,
            dueDate: reminder.dueDate ? `जो *${new Date(reminder.dueDate).toLocaleDateString()}* तक देय है।` : '.',
            payment: vendor.upiId ? `\n\nआप UPI से भुगतान कर सकते हैं: *${vendor.upiId}*` : '',
            contact: `\n\nकिसी भी प्रश्न के लिए, कृपया ${vendor.phoneNumber} पर संपर्क करें`,
            closing: '\n\nधन्यवाद!'
        }
    };

    const template = templates[language] || templates.en;

    return `${template.greeting}\n\n${template.body}\n\n${template.amount} ${template.dueDate}${template.payment}${template.contact}${template.closing}`;
};

/**
 * Format an invoice message
 * @param {object} invoice - Invoice data
 * @param {object} vendor - Vendor information
 * @param {string} language - Language code ('en' or 'hi')
 * @returns {string} Formatted message
 */
export const formatInvoiceMessage = (invoice, vendor, language = 'en') => {
    const templates = {
        en: {
            greeting: `Hello ${invoice.customerName},`,
            body: `Thank you for your business with *${vendor.shopName}*!`,
            invoice: `\n\n*Invoice #${invoice.invoiceNumber}*`,
            date: `\nDate: ${new Date(invoice.date || invoice.createdAt).toLocaleDateString()}`,
            amount: `\nTotal Amount: *₹${invoice.totalAmount}*`,
            status: `\nStatus: ${invoice.status}`,
            items: formatInvoiceItems(invoice.items, 'en'),
            payment: vendor.upiId ? `\n\nPay via UPI: *${vendor.upiId}*` : '',
            closing: '\n\nThank you for your business!'
        },
        hi: {
            greeting: `नमस्ते ${invoice.customerName},`,
            body: `*${vendor.shopName}* के साथ व्यापार के लिए धन्यवाद!`,
            invoice: `\n\n*चालान #${invoice.invoiceNumber}*`,
            date: `\nतारीख: ${new Date(invoice.date || invoice.createdAt).toLocaleDateString()}`,
            amount: `\nकुल राशि: *₹${invoice.totalAmount}*`,
            status: `\nस्थिति: ${invoice.status}`,
            items: formatInvoiceItems(invoice.items, 'hi'),
            payment: vendor.upiId ? `\n\nUPI से भुगतान करें: *${vendor.upiId}*` : '',
            closing: '\n\nआपके व्यापार के लिए धन्यवाद!'
        }
    };

    const template = templates[language] || templates.en;

    return `${template.greeting}\n\n${template.body}${template.invoice}${template.date}${template.amount}${template.status}${template.items}${template.payment}${template.closing}`;
};

/**
 * Format invoice items list
 * @param {Array} items - Invoice items
 * @param {string} language - Language code
 * @returns {string} Formatted items list
 */
const formatInvoiceItems = (items, language = 'en') => {
    if (!items || items.length === 0) return '';

    const header = language === 'hi' ? '\n\n*वस्तुएं:*\n' : '\n\n*Items:*\n';

    const itemsList = items.map((item, index) => {
        return `${index + 1}. ${item.name} - ₹${item.price} x ${item.quantity} = ₹${item.total}`;
    }).join('\n');

    return header + itemsList;
};

/**
 * Format a low stock alert message
 * @param {Array} lowStockItems - Array of low stock products
 * @param {object} vendor - Vendor information
 * @param {string} language - Language code ('en' or 'hi')
 * @returns {string} Formatted message
 */
export const formatLowStockAlert = (lowStockItems, vendor, language = 'en') => {
    const templates = {
        en: {
            title: `*Low Stock Alert* - ${vendor.shopName}`,
            body: '\n\nThe following items are running low:',
            itemFormat: (item) => `\n• ${item.name}: Only *${item.quantity}* left`,
            closing: '\n\nPlease restock soon!'
        },
        hi: {
            title: `*कम स्टॉक चेतावनी* - ${vendor.shopName}`,
            body: '\n\nनिम्नलिखित वस्तुएं कम हो रही हैं:',
            itemFormat: (item) => `\n• ${item.name}: केवल *${item.quantity}* बची हैं`,
            closing: '\n\nकृपया जल्द ही स्टॉक भरें!'
        }
    };

    const template = templates[language] || templates.en;

    let message = template.title + template.body;

    lowStockItems.forEach(item => {
        message += template.itemFormat(item);
    });

    message += template.closing;

    return message;
};

/**
 * Format a sale confirmation message
 * @param {object} sale - Sale data
 * @param {object} vendor - Vendor information
 * @param {string} language - Language code ('en' or 'hi')
 * @returns {string} Formatted message
 */
export const formatSaleConfirmation = (sale, vendor, language = 'en') => {
    const templates = {
        en: {
            title: `*Sale Confirmation* - ${vendor.shopName}`,
            customer: `\n\nCustomer: ${sale.customerName || 'Walk-in'}`,
            date: `\nDate: ${new Date(sale.saleDate || sale.createdAt).toLocaleString()}`,
            amount: `\nTotal: *₹${sale.totalAmount}*`,
            payment: `\nPayment Method: ${sale.paymentMethod}`,
            closing: '\n\nThank you for your purchase!'
        },
        hi: {
            title: `*बिक्री पुष्टि* - ${vendor.shopName}`,
            customer: `\n\nग्राहक: ${sale.customerName || 'वॉक-इन'}`,
            date: `\nतारीख: ${new Date(sale.saleDate || sale.createdAt).toLocaleString()}`,
            amount: `\nकुल: *₹${sale.totalAmount}*`,
            payment: `\nभुगतान विधि: ${sale.paymentMethod}`,
            closing: '\n\nआपकी खरीदारी के लिए धन्यवाद!'
        }
    };

    const template = templates[language] || templates.en;

    return `${template.title}${template.customer}${template.date}${template.amount}${template.payment}${template.closing}`;
};

/**
 * Get common WhatsApp message templates
 * @param {string} language - Language code ('en' or 'hi')
 * @returns {object} Templates object
 */
export const getMessageTemplates = (language = 'en') => {
    const templates = {
        en: {
            welcome: 'Welcome to our shop! How can we help you today?',
            thankYou: 'Thank you for your business!',
            orderConfirmation: 'Your order has been confirmed.',
            paymentReceived: 'Payment received successfully. Thank you!',
            shopClosed: 'We are currently closed. Our business hours are {{hours}}',
            helpMessage: 'For assistance, please call {{phone}} or visit our shop at {{address}}'
        },
        hi: {
            welcome: 'हमारी दुकान में आपका स्वागत है! हम आपकी कैसे मदद कर सकते हैं?',
            thankYou: 'आपके व्यापार के लिए धन्यवाद!',
            orderConfirmation: 'आपका आदेश की पुष्टि हो गई है।',
            paymentReceived: 'भुगतान सफलतापूर्वक प्राप्त हुआ। धन्यवाद!',
            shopClosed: 'हम फिलहाल बंद हैं। हमारे व्यापार के घंटे हैं {{hours}}',
            helpMessage: 'सहायता के लिए, कृपया {{phone}} पर कॉल करें या {{address}} पर हमारी दुकान पर आएं'
        }
    };

    return templates[language] || templates.en;
};

/**
 * Replace template variables in a message
 * @param {string} template - Message template
 * @param {object} variables - Variables to replace
 * @returns {string} Formatted message
 */
export const replaceTemplateVariables = (template, variables) => {
    let message = template;

    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        message = message.replace(regex, variables[key]);
    });

    return message;
};
