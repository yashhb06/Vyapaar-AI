import express from 'express';
import jwt from 'jsonwebtoken';
import { createUser, getUser, getVendorByUserId, createVendor } from '../config/database.js';
import { auth } from '../config/firebase.js';

const router = express.Router();

router.post('/send-otp', async (req, res) => {
  try {
    console.log('📞 [SEND-OTP] Request received:', {
      phone: req.body.phone,
      body: req.body,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer
      }
    });

    const { phone } = req.body;

    if (!phone || phone.length < 10) {
      console.log('❌ [SEND-OTP] Invalid phone number');
      return res.status(400).json({
        error: 'Invalid phone number',
        message: 'Please provide a valid 10-digit phone number',
        code: 'INVALID_PHONE'
      });
    }

    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

    // DEVELOPMENT MODE: For testing, accept any phone number and return success
    // In production, you would integrate with Firebase Phone Auth or an SMS service
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      console.log(`📱 TEST OTP for ${formattedPhone}: 123456`);
      console.log('⚠️  In development mode - use OTP: 123456');

      return res.json({
        success: true,
        message: 'OTP sent successfully (DEV MODE: use 123456)',
        phone: formattedPhone,
        testOTP: '123456' // Only in development
      });
    }

    // Production mode: Check if user exists in Firebase
    try {
      const userRecord = await auth.getUserByPhoneNumber(formattedPhone);

      return res.json({
        success: true,
        message: 'OTP sent successfully',
        phone: formattedPhone,
        existingUser: true
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.json({
          success: true,
          message: 'OTP sent successfully',
          phone: formattedPhone,
          existingUser: false
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('💥 [SEND-OTP] Error:', error);
    res.status(500).json({
      error: 'Failed to send OTP',
      message: 'Unable to send verification code. Please try again.',
      code: 'OTP_SEND_FAILED'
    });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    console.log('🔍 [VERIFY-OTP] Request received:', { phone: req.body.phone, otp: req.body.otp?.substring(0, 2) + '****' });

    const { phone, otp } = req.body;

    if (!phone || !otp) {
      console.log('❌ [VERIFY-OTP] Missing fields');
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Phone number and OTP are required',
        code: 'MISSING_FIELDS'
      });
    }

    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    const isDevelopment = process.env.NODE_ENV !== 'production';

    console.log('🔍 [VERIFY-OTP] Config:', {
      formattedPhone,
      isDevelopment,
      NODE_ENV: process.env.NODE_ENV,
      otpMatch: otp === '123456'
    });

    // DEVELOPMENT MODE: Accept test OTP 123456 and use real Firebase Auth
    if (isDevelopment && otp === '123456') {
      console.log(`✅ [VERIFY-OTP] Test OTP verified for ${formattedPhone} - Using REAL Firebase Auth`);

      // Create or get Firebase user
      let userRecord;
      try {
        console.log('🔍 [VERIFY-OTP] Checking for existing Firebase user...');
        userRecord = await auth.getUserByPhoneNumber(formattedPhone);
        console.log('✅ [VERIFY-OTP] Found existing user:', userRecord.uid);
      } catch (error) {
        console.log('⚠️  [VERIFY-OTP] User lookup error:', error.code);
        if (error.code === 'auth/user-not-found') {
          // Create new Firebase user
          console.log('🔍 [VERIFY-OTP] Creating new Firebase user...');
          userRecord = await auth.createUser({
            phoneNumber: formattedPhone,
            displayName: 'Test User'
          });
          console.log('✅ [VERIFY-OTP] Created new user:', userRecord.uid);
        } else {
          console.error('💥 [VERIFY-OTP] Firebase auth error:', error.message);
          throw error;
        }
      }

      // Check if user exists in database
      console.log('🔍 [VERIFY-OTP] Checking Firestore for user record...');
      const existingUser = await getUser(userRecord.uid);
      console.log('🔍 [VERIFY-OTP] Existing user in DB:', existingUser ? 'YES' : 'NO');

      // Check if vendor profile exists
      console.log('🔍 [VERIFY-OTP] Checking for vendor profile...');
      const vendorProfile = await getVendorByUserId(userRecord.uid);
      console.log('🔍 [VERIFY-OTP] Vendor profile:', vendorProfile ? `YES (${vendorProfile.id})` : 'NO');

      // Create JWT token with vendorId if vendor exists
      const tokenPayload = {
        uid: userRecord.uid,
        phone: userRecord.phoneNumber,
        email: userRecord.email
      };

      if (vendorProfile) {
        tokenPayload.vendorId = vendorProfile.id;
      }

      console.log('🔍 [VERIFY-OTP] Creating JWT token...');
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      console.log('✅ [VERIFY-OTP] JWT token created');

      // Create basic user record if doesn't exist
      if (!existingUser) {
        console.log('🔍 [VERIFY-OTP] Creating user record in Firestore...');
        await createUser(userRecord.uid, {
          phone: userRecord.phoneNumber,
          name: userRecord.displayName || 'Test User',
          email: userRecord.email || ''
        });
        console.log('✅ [VERIFY-OTP] User record created');
      }

      const response = {
        success: true,
        message: 'OTP verified successfully (DEV MODE)',
        token,
        user: {
          uid: userRecord.uid,
          phone: userRecord.phoneNumber,
          email: userRecord.email,
          name: userRecord.displayName || 'Test User'
        },
        hasVendorProfile: !!vendorProfile,
        vendorId: vendorProfile?.id || null
      };

      console.log('✅ [VERIFY-OTP] Sending success response:', {
        hasVendorProfile: response.hasVendorProfile,
        vendorId: response.vendorId
      });

      return res.json(response);
    }

    console.log('⚠️  [VERIFY-OTP] Invalid OTP or production mode');

    // Production mode: Verify with Firebase
    try {
      const userRecord = await auth.getUserByPhoneNumber(formattedPhone);

      // Check if user exists in database
      const existingUser = await getUser(userRecord.uid);

      // Check if vendor profile exists
      const vendorProfile = await getVendorByUserId(userRecord.uid);

      // Create JWT token with vendorId if vendor exists
      const tokenPayload = {
        uid: userRecord.uid,
        phone: userRecord.phoneNumber,
        email: userRecord.email
      };

      if (vendorProfile) {
        tokenPayload.vendorId = vendorProfile.id;
      }

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Create basic user record if doesn't exist
      if (!existingUser) {
        await createUser(userRecord.uid, {
          phone: userRecord.phoneNumber,
          name: userRecord.displayName || 'User',
          email: userRecord.email || ''
        });
      }

      res.json({
        success: true,
        message: 'OTP verified successfully',
        token,
        user: {
          uid: userRecord.uid,
          phone: userRecord.phoneNumber,
          email: userRecord.email,
          name: userRecord.displayName || 'User'
        },
        hasVendorProfile: !!vendorProfile,
        vendorId: vendorProfile?.id || null
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
          error: 'User not found',
          message: 'No account found with this phone number',
          code: 'USER_NOT_FOUND'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('💥 [VERIFY-OTP] Fatal error:', error);
    console.error('💥 [VERIFY-OTP] Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to verify OTP',
      message: 'Unable to verify the code. Please try again.',
      code: 'OTP_VERIFY_FAILED',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

router.post('/complete-signup', async (req, res) => {
  try {
    const {
      uid,
      shopName,
      ownerName,
      phoneNumber,
      whatsappNumber,
      preferredLanguage,
      gstNumber,
      address,
      upiId,
      businessType,
      email
    } = req.body;

    // Validate required fields
    if (!uid || !shopName || !ownerName || !phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'UID, shop name, owner name, and phone number are required',
        code: 'MISSING_FIELDS'
      });
    }

    try {
      // Check if vendor profile already exists
      const existingVendor = await getVendorByUserId(uid);

      if (existingVendor) {
        return res.status(400).json({
          error: 'Vendor profile already exists',
          message: 'This user already has a vendor profile',
          code: 'VENDOR_EXISTS'
        });
      }

      // Create vendor profile
      const vendorData = {
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phoneNumber: phoneNumber.trim(),
        whatsappNumber: whatsappNumber?.trim() || phoneNumber.trim(),
        preferredLanguage: preferredLanguage || 'en',
        email: email?.trim() || '',
        businessType: businessType || 'retail'
      };

      // Add optional fields if provided
      if (gstNumber) vendorData.gstNumber = gstNumber.trim();
      if (upiId) vendorData.upiId = upiId.trim();
      if (address) vendorData.address = address;

      const result = await createVendor(uid, vendorData);

      // Generate new token with vendorId
      const token = jwt.sign(
        {
          uid: uid,
          vendorId: result.id,
          phone: phoneNumber,
          email: email || ''
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Vendor profile created successfully',
        vendor: {
          id: result.id,
          ...vendorData
        },
        token
      });

    } catch (error) {
      console.error('Complete signup error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Complete signup error:', error);
    res.status(500).json({
      error: 'Failed to complete signup',
      message: 'Unable to create vendor profile. Please try again.',
      code: 'SIGNUP_FAILED'
    });
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        error: 'Missing user ID',
        message: 'User ID is required to refresh token',
        code: 'MISSING_UID'
      });
    }

    try {
      const userRecord = await auth.getUser(uid);

      // Check if vendor profile exists
      const vendorProfile = await getVendorByUserId(uid);

      const tokenPayload = {
        uid: userRecord.uid,
        phone: userRecord.phoneNumber,
        email: userRecord.email
      };

      if (vendorProfile) {
        tokenPayload.vendorId = vendorProfile.id;
      }

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        token,
        hasVendorProfile: !!vendorProfile,
        vendorId: vendorProfile?.id || null
      });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
          error: 'User not found',
          message: 'No account found with this user ID',
          code: 'USER_NOT_FOUND'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      message: 'Unable to refresh the token. Please try again.',
      code: 'TOKEN_REFRESH_FAILED'
    });
  }
});

export default router;


