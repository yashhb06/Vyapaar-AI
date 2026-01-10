import express from 'express';
import OpenAI from 'openai';
import {
  getInventoryItems,
  getPaymentReminders,
  getInvoices,
  getWhatsAppSettings,
  updateWhatsAppSettings
} from '../config/database.js';
import { authenticateToken, requireVendor } from '../middleware/auth.js';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Webhook endpoints don't need authentication (they're called by Meta)
// GET /webhook - Webhook verification (Meta will call this during setup)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'vyapar_webhook_verify';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// POST /webhook - Receive incoming WhatsApp messages
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Acknowledge receipt immediately
    res.sendStatus(200);

    // Check if this is a WhatsApp Business message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Check if we received a message
      if (value?.messages?.[0]) {
        const message = value.messages[0];
        const from = message.from; // Customer's phone number
        const messageBody = message.text?.body || '';
        const messageId = message.id;

        console.log(`📩 Received WhatsApp message from ${from}: ${messageBody}`);

        // TODO: Process the incoming message
        // For now, we'll just log it
        // In the future, you can:
        // 1. Save to database
        // 2. Auto-reply based on settings
        // 3. Use AI to respond intelligently
      }

      // Check for message status updates
      if (value?.statuses?.[0]) {
        const status = value.statuses[0];
        console.log(`📊 Message status update: ${status.status}`);
        // TODO: Update message delivery status in database
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Don't throw error - we already sent 200 response
  }
});

// All other routes require authentication
router.use(authenticateToken);
router.use(requireVendor);

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message required',
        message: 'Please provide a message',
        code: 'MISSING_MESSAGE'
      });
    }

    const [inventoryItems, paymentReminders, invoices, whatsappSettings] = await Promise.all([
      getInventoryItems(req.vendor.id),
      getPaymentReminders(req.vendor.id),
      getInvoices(req.vendor.id),
      getWhatsAppSettings(req.user.uid)
    ]);

    const businessContext = {
      inventory: inventoryItems.slice(0, 10).map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
      })),
      payments: paymentReminders.filter(r => r.status === 'pending' || r.status === 'overdue').slice(0, 5).map(reminder => ({
        customer: reminder.customerName,
        amount: reminder.amount,
        dueDate: reminder.dueDate,
        status: reminder.status
      })),
      recentInvoices: invoices.slice(0, 5).map(invoice => ({
        customer: invoice.customerName,
        amount: invoice.totalAmount,
        status: invoice.status,
        date: invoice.date
      })),
      settings: whatsappSettings
    };

    const systemPrompt = `
You are a helpful WhatsApp assistant for a small business in India. You help customers with:

1. Store information (timings, location, services)
2. Product availability and prices
3. Payment status and reminders
4. Order tracking
5. General inquiries

Business Context:
- Store Name: ${req.vendor.shopName}
- Owner: ${req.vendor.ownerName}
- Inventory: ${JSON.stringify(businessContext.inventory)}
- Pending Payments: ${JSON.stringify(businessContext.payments)}
- Recent Invoices: ${JSON.stringify(businessContext.recentInvoices)}
- Store Settings: ${JSON.stringify(businessContext.settings)}

Guidelines:
- Respond in a friendly, helpful tone
- Use both English and Hindi as appropriate
- Be concise but informative
- If asked about specific products, check the inventory
- If asked about payments, check the payment reminders
- If you don't have specific information, say so politely
- Always be professional and helpful

Customer Message: "${message}"

Provide a helpful response based on the business context. If the message is in Hindi, respond in Hindi. If in English, respond in English. Be conversational and helpful.
`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const reply = chatResponse.choices[0].message.content;

    res.json({
      success: true,
      reply: reply.trim(),
      context: {
        inventoryChecked: message.toLowerCase().includes('stock') || message.toLowerCase().includes('available'),
        paymentChecked: message.toLowerCase().includes('payment') || message.toLowerCase().includes('due'),
        invoiceChecked: message.toLowerCase().includes('invoice') || message.toLowerCase().includes('bill')
      }
    });

  } catch (error) {
    console.error('WhatsApp chat error:', error);
    res.status(500).json({
      error: 'Chat processing failed',
      message: 'Unable to process the message',
      code: 'CHAT_PROCESSING_FAILED'
    });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const settings = await getWhatsAppSettings(req.user.uid);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get WhatsApp settings error:', error);
    res.status(500).json({
      error: 'Failed to fetch WhatsApp settings',
      message: 'Unable to retrieve WhatsApp settings',
      code: 'WHATSAPP_SETTINGS_FETCH_FAILED'
    });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const {
      isConnected,
      autoReplyEnabled,
      templates,
      faqs,
      businessHours,
      welcomeMessage,
      offlineMessage
    } = req.body;

    const settingsData = {
      isConnected: isConnected || false,
      autoReplyEnabled: autoReplyEnabled || false,
      templates: templates || [],
      faqs: faqs || [],
      businessHours: businessHours || { start: '09:00', end: '21:00' },
      welcomeMessage: welcomeMessage || 'नमस्ते! आपका स्वागत है। हम आपकी कैसे मदद कर सकते हैं?',
      offlineMessage: offlineMessage || 'हमारी दुकान अभी बंद है। कृपया बाद में संपर्क करें।'
    };

    await updateWhatsAppSettings(req.user.uid, settingsData);

    res.json({
      success: true,
      message: 'WhatsApp settings updated successfully',
      data: settingsData
    });
  } catch (error) {
    console.error('Update WhatsApp settings error:', error);
    res.status(500).json({
      error: 'Failed to update WhatsApp settings',
      message: 'Unable to update WhatsApp settings',
      code: 'WHATSAPP_SETTINGS_UPDATE_FAILED'
    });
  }
});

router.post('/send-message', async (req, res) => {
  try {
    const { phone, message, templateId, templateParams } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Phone number and message are required',
        code: 'MISSING_FIELDS'
      });
    }

    const whatsappSettings = await getWhatsAppSettings(req.user.uid);

    if (!whatsappSettings.isConnected) {
      return res.status(400).json({
        error: 'WhatsApp not connected',
        message: 'Please connect your WhatsApp Business account first',
        code: 'WHATSAPP_NOT_CONNECTED'
      });
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone; // Add India country code
    }

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.warn('⚠️ WhatsApp API not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env');

      // Return simulated success for development
      return res.json({
        success: true,
        message: 'Message queued (WhatsApp API not configured)',
        data: {
          phone: formattedPhone,
          message: message,
          simulated: true
        }
      });
    }

    // Send message via WhatsApp Cloud API
    const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const messagePayload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: { body: message }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp API error:', errorData);

      throw new Error(errorData.error?.message || 'WhatsApp API request failed');
    }

    const result = await response.json();

    res.json({
      success: true,
      message: 'Message sent successfully via WhatsApp',
      data: {
        messageId: result.messages[0].id,
        phone: formattedPhone,
        status: 'sent'
      }
    });

  } catch (error) {
    console.error('Send WhatsApp message error:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error.message || 'Unable to send WhatsApp message',
      code: 'MESSAGE_SEND_FAILED'
    });
  }
});

// POST /send-payment-reminder - Send payment reminder via WhatsApp
router.post('/send-payment-reminder', async (req, res) => {
  try {
    const { reminderId, phone, customerName, amount, dueDate } = req.body;

    if (!phone || !customerName || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Phone, customer name, and amount are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Format the reminder message
    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('en-IN') : 'today';
    const message = `नमस्ते ${customerName} जी!\n\nयह आपके बकाया भुगतान की अनुस्मारक है:\n💰 राशि: ₹${amount}\n📅 नियत तारीख: ${formattedDueDate}\n\nकृपया जल्द से जल्द भुगतान करें। धन्यवाद!\n\n${req.vendor.shopName}`;

    // Use the existing send-message logic
    const formattedPhone = phone.replace(/\D/g, '');
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.warn('⚠️ WhatsApp API not configured');
      return res.json({
        success: true,
        message: 'Reminder queued (WhatsApp API not configured)',
        data: { phone: formattedPhone, reminderId, simulated: true }
      });
    }

    const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to send reminder');
    }

    const result = await response.json();

    res.json({
      success: true,
      message: 'Payment reminder sent successfully',
      data: {
        messageId: result.messages[0].id,
        reminderId,
        phone: formattedPhone
      }
    });

  } catch (error) {
    console.error('Send payment reminder error:', error);
    res.status(500).json({
      error: 'Failed to send reminder',
      message: error.message || 'Unable to send payment reminder',
      code: 'REMINDER_SEND_FAILED'
    });
  }
});

// POST /send-inventory-alert - Send low stock alert via WhatsApp
router.post('/send-inventory-alert', async (req, res) => {
  try {
    const { ownerPhone, items } = req.body;

    if (!ownerPhone || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Owner phone and items are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Format the alert message
    const itemsList = items.map(item =>
      `• ${item.name} - केवल ${item.quantity} ${item.unit || 'units'} बचे हैं`
    ).join('\n');

    const message = `⚠️ कम स्टॉक की चेतावनी!\n\n${req.vendor.shopName}\n\nनिम्नलिखित वस्तुओं का स्टॉक कम है:\n\n${itemsList}\n\nकृपया जल्द से जल्द पुनःस्टॉक करें।`;

    const formattedPhone = ownerPhone.replace(/\D/g, '');
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.warn('⚠️ WhatsApp API not configured');
      return res.json({
        success: true,
        message: 'Alert queued (WhatsApp API not configured)',
        data: { phone: formattedPhone, itemCount: items.length, simulated: true }
      });
    }

    const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to send alert');
    }

    const result = await response.json();

    res.json({
      success: true,
      message: 'Inventory alert sent successfully',
      data: {
        messageId: result.messages[0].id,
        phone: formattedPhone,
        itemCount: items.length
      }
    });

  } catch (error) {
    console.error('Send inventory alert error:', error);
    res.status(500).json({
      error: 'Failed to send alert',
      message: error.message || 'Unable to send inventory alert',
      code: 'ALERT_SEND_FAILED'
    });
  }
});

router.post('/test-bot', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message required',
        message: 'Please provide a test message',
        code: 'MISSING_MESSAGE'
      });
    }

    const whatsappSettings = await getWhatsAppSettings(req.user.uid);

    const activeFAQs = whatsappSettings.faqs?.filter(faq => faq.isActive) || [];
    const matchingFAQ = activeFAQs.find(faq =>
      faq.question.toLowerCase().includes(message.toLowerCase()) ||
      message.toLowerCase().includes(faq.question.toLowerCase())
    );

    let reply;
    if (matchingFAQ) {
      reply = matchingFAQ.answer;
    } else {
      reply = whatsappSettings.offlineMessage || 'मुझे खुशी होगी आपकी मदद करने में! कृपया और विस्तार से बताएं या हमारे दुकान के समय के दौरान संपर्क करें।';
    }

    res.json({
      success: true,
      reply,
      matchedFAQ: matchingFAQ ? {
        question: matchingFAQ.question,
        answer: matchingFAQ.answer
      } : null
    });

  } catch (error) {
    console.error('Test bot error:', error);
    res.status(500).json({
      error: 'Bot test failed',
      message: 'Unable to test the bot',
      code: 'BOT_TEST_FAILED'
    });
  }
});

export default router;


