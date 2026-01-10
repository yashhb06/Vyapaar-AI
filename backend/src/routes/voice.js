import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import {
  addInventoryItem,
  addPaymentReminder,
  createSale
} from '../config/database.js';
import { authenticateToken, requireVendor } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireVendor);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

router.post('/process-command', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided',
        message: 'Please provide an audio file',
        code: 'NO_AUDIO_FILE'
      });
    }

    const audioBuffer = req.file.buffer;
    const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: req.vendor.preferredLanguage || 'en'
    });

    const transcribedText = transcription.text;

    const analysisPrompt = `
You are an AI assistant for a business management system. Analyze the following voice command and determine the intent and extract relevant information.

Voice command: "${transcribedText}"

Please respond with a JSON object containing:
1. intent: Either "ADD_INVENTORY", "CREATE_PAYMENT_REMINDER", or "CREATE_SALE"
2. extracted_data: Object with relevant fields based on the intent

For ADD_INVENTORY intent, extract:
- name: product name
- quantity: number of items
- price: price per item
- category: product category (optional)

For CREATE_PAYMENT_REMINDER intent, extract:
- customerName: customer name
- amount: payment amount
- dueDate: due date (if mentioned, otherwise use "today")
- phone: phone number (if mentioned)

For CREATE_SALE intent, extract:
- customerName: customer name (optional)
- items: array of {name, quantity, price}
- paymentMethod: cash/upi/card (optional)
- totalAmount: total sale amount

Examples:
- "Add 10 Maggi packets at 12 rupees each" -> ADD_INVENTORY
- "Send Ramesh a 1200 rupees reminder for Friday" -> CREATE_PAYMENT_REMINDER
- "Stock 15 Tata Tea Gold at 145 rupees per pack" -> ADD_INVENTORY
- "Remind Amit to pay 2500 rupees today" -> CREATE_PAYMENT_REMINDER

Respond only with valid JSON, no additional text.
`;

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: analysisPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const analysis = JSON.parse(analysisResponse.choices[0].message.content);
    const { intent, extracted_data } = analysis;

    let result;

    if (intent === 'ADD_INVENTORY') {
      const { name, quantity, price, category } = extracted_data;

      if (!name || !quantity || !price) {
        return res.status(400).json({
          error: 'Incomplete inventory data',
          message: 'Could not extract complete product information from voice command',
          code: 'INCOMPLETE_INVENTORY_DATA'
        });
      }

      const itemData = {
        name: name.trim(),
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category: category?.trim() || 'General',
        threshold: 10
      };

      const addResult = await addInventoryItem(req.user.uid, itemData, req.vendor.id);

      result = {
        action: 'ADD_INVENTORY',
        message: `Added ${quantity} units of ${name} to inventory`,
        data: { id: addResult.id, ...itemData }
      };

    } else if (intent === 'CREATE_PAYMENT_REMINDER') {
      const { customerName, amount, dueDate, phone } = extracted_data;

      if (!customerName || !amount) {
        return res.status(400).json({
          error: 'Incomplete payment data',
          message: 'Could not extract complete payment information from voice command',
          code: 'INCOMPLETE_PAYMENT_DATA'
        });
      }

      const dueDateObj = dueDate === 'today' ? new Date() : new Date(dueDate);
      const now = new Date();
      const status = dueDateObj < now ? 'overdue' : 'pending';

      const reminderData = {
        customerName: customerName.trim(),
        amount: parseFloat(amount),
        dueDate: dueDateObj,
        phone: phone?.trim() || '',
        status,
        originalText: transcribedText
      };

      const addResult = await addPaymentReminder(req.user.uid, reminderData, req.vendor.id);

      result = {
        action: 'CREATE_PAYMENT_REMINDER',
        message: `Created payment reminder for ${customerName} - ₹${amount}`,
        data: { id: addResult.id, ...reminderData }
      };

    } else if (intent === 'CREATE_SALE') {
      const { customerName, items, paymentMethod, totalAmount } = extracted_data;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Incomplete sale data',
          message: 'Could not extract items information from voice command',
          code: 'INCOMPLETE_SALE_DATA'
        });
      }

      const saleData = {
        customerName: customerName?.trim() || 'Walk-in Customer',
        items: items.map(item => ({
          name: item.name?.trim() || '',
          quantity: parseInt(item.quantity) || 0,
          price: parseFloat(item.price) || 0,
          total: (parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)
        })),
        paymentMethod: paymentMethod || 'cash',
        totalAmount: parseFloat(totalAmount) || items.reduce((sum, item) =>
          sum + ((parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0
        ),
        saleDate: new Date()
      };

      const addResult = await createSale(req.vendor.id, saleData);

      result = {
        action: 'CREATE_SALE',
        message: `Sale recorded for ${saleData.customerName} - ₹${saleData.totalAmount}`,
        data: { id: addResult.id, ...saleData }
      };

    } else {
      return res.status(400).json({
        error: 'Unrecognized intent',
        message: 'Could not determine the action from voice command',
        code: 'UNRECOGNIZED_INTENT'
      });
    }

    res.json({
      success: true,
      transcribedText,
      ...result
    });

  } catch (error) {
    console.error('Voice processing error:', error);

    if (error.message === 'Only audio files are allowed') {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Please provide a valid audio file',
        code: 'INVALID_FILE_TYPE'
      });
    }

    if (error.code === 'file_too_large') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Audio file must be less than 25MB',
        code: 'FILE_TOO_LARGE'
      });
    }

    res.status(500).json({
      error: 'Voice processing failed',
      message: 'Unable to process the voice command',
      code: 'VOICE_PROCESSING_FAILED'
    });
  }
});

router.post('/test-transcription', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided',
        message: 'Please provide an audio file',
        code: 'NO_AUDIO_FILE'
      });
    }

    const audioBuffer = req.file.buffer;
    const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en'
    });

    res.json({
      success: true,
      transcribedText: transcription.text
    });

  } catch (error) {
    console.error('Transcription test error:', error);
    res.status(500).json({
      error: 'Transcription failed',
      message: 'Unable to transcribe the audio',
      code: 'TRANSCRIPTION_FAILED'
    });
  }
});

export default router;


