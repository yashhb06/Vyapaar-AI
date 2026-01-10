# WhatsApp Business API Setup Guide
**Meta Cloud API Integration for Vyapar**

This guide will help you set up WhatsApp Business API using Meta's Cloud API (free tier).

## Prerequisites

- A Facebook Business Account
- A WhatsApp Business Account
- A phone number that is NOT currently using WhatsApp
- Access to the phone number for verification

## Step-by-Step Setup

### 1. Create a Meta Developer Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"Get Started"** in the top right
3. Log in with your Facebook account
4. Complete the registration process

### 2. Create a Meta App

1. Go to [Meta Apps Dashboard](https://developers.facebook.com/apps)
2. Click **"Create App"**
3. Select **"Business"** as the app type
4. Fill in the details:
   - **App Name**: "Vyapar WhatsApp Integration" (or your choice)
   - **App Contact Email**: Your email
5. Click **"Create App"**

### 3. Add WhatsApp Product

1. In your app dashboard, scroll to **"Add Products to Your App"**
2. Find **"WhatsApp"** and click **"Set Up"**
3. You'll be redirected to WhatsApp setup page

### 4. Configure WhatsApp Business Account

1. In the WhatsApp setup page, you'll see **"API Setup"** section
2. Click **"Start using the API"**
3. You'll need to:
   - **Create or select a Business Account**
   - **Add a phone number** (this will be your WhatsApp Business number)
   - **Verify the phone number** (you'll receive a verification code via SMS)

### 5. Get Your Credentials

Once setup is complete, you'll need these credentials:

#### **5.1 Get Access Token (Temporary)**

1. In the WhatsApp API setup page, under **"API Setup"**
2. You'll see a **"Temporary access token"** - copy this
3. ⚠️ **Important**: This token expires in 24 hours. We'll generate a permanent one later.

#### **5.2 Get Phone Number ID**

1. In the **"API Setup"** section
2. Under **"From"**, you'll see your phone number
3. Click on it to copy the **Phone Number ID** (it's a long number like `123456789012345`)

#### **5.3 Get WhatsApp Business Account ID**

1. In the left sidebar, click **"WhatsApp" → "Getting Started"**
2. You'll see **"Business Account ID"** - copy this number

#### **5.4 Generate Permanent Access Token**

1. Go to **"Tools" → "Graph API Explorer"** in your Meta app dashboard
2. Select your app from the dropdown
3. Click **"Generate Access Token"**
4. Select these permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. Click **"Generate Token"**
6. **Save this token securely** - this is your permanent access token

### 6. Set Up Webhook (for receiving messages)

We'll configure this after updating the backend code.

1. You'll need a publicly accessible HTTPS URL
2. For local development, use **ngrok** or **localtunnel**:
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start your backend server first (on port 3000)
   # Then in another terminal, run:
   ngrok http 3000
   
   # You'll get a URL like: https://abc123.ngrok.io
   ```

3. In Meta app dashboard, go to **WhatsApp → Configuration**
4. Click **"Edit"** next to Webhook
5. Enter:
   - **Callback URL**: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
   - **Verify Token**: Create a random string (e.g., `vyapar_webhook_2026_secure`)
6. Click **"Verify and Save"**
7. Subscribe to webhook fields:
   - ✅ `messages`
   - ✅ `message_status`

### 7. Add Credentials to Your App

Once you have all credentials, add them to `backend/.env`:

```env
# WhatsApp Business API Configuration (Meta Cloud API)
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=vyapar_webhook_2026_secure
```

### 8. Test Your Setup

After implementing the code changes, test with:

```bash
# Send a test message using curl
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "text",
    "text": {
      "body": "Hello from Vyapar! This is a test message."
    }
  }'
```

## Important Notes

### Free Tier Limits

- ✅ **1,000 free conversations per month**
- A conversation is a 24-hour window after user's first message
- Business-initiated messages count as new conversations

### Phone Number Requirements

- Must not be registered with regular WhatsApp
- Should be a mobile number (not landline)
- Can receive SMS for verification
- Cannot be a virtual/VoIP number (usually)

### Message Templates

For business-initiated messages (like payment reminders), you need **approved message templates**:

1. Go to **WhatsApp → Message Templates** in your app dashboard
2. Create a new template:
   - **Name**: `payment_reminder`
   - **Category**: `UTILITY`
   - **Language**: English
   - **Body**: 
     ```
     Hello {{1}}! This is a reminder for your pending payment of ₹{{2}} due on {{3}}. 
     Please pay at your earliest convenience. Thank you!
     ```
3. Submit for approval (usually takes a few hours)

### Production Checklist

Before going to production:

- [ ] Business verification completed
- [ ] Display name approved
- [ ] Message templates approved
- [ ] Payment method added (for paid usage)
- [ ] Phone number ownership verified
- [ ] Privacy policy URL added
- [ ] SSL certificate for webhook URL

## Troubleshooting

### "Invalid Phone Number" Error
- Ensure phone number format is: `+` + country code + number (e.g., `+919876543210`)
- No spaces or special characters

### Webhook Verification Failed
- Check that verify token matches exactly
- Ensure webhook URL is HTTPS (use ngrok for local testing)
- Verify backend server is running

### "Authorization Failed" Error
- Regenerate access token
- Check token has correct permissions
- Ensure token hasn't expired

## Next Steps

After completing this setup:

1. ✅ Add credentials to `backend/.env`
2. ✅ Run the updated backend code (we'll implement this next)
3. ✅ Test webhook verification
4. ✅ Send a test message
5. ✅ Configure message templates

## Useful Links

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta for Developers Dashboard](https://developers.facebook.com/apps)
- [WhatsApp Message Templates Guide](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

📧 **Need Help?** Check the [Meta WhatsApp Community](https://developers.facebook.com/community/whatsapp) for support.
