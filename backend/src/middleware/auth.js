import jwt from 'jsonwebtoken';
import { auth } from '../config/firebase.js';
import { getVendor } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Fetch vendor context if vendorId is present in token
      if (decoded.vendorId) {
        try {
          const vendor = await getVendor(decoded.vendorId);
          if (vendor && vendor.isActive) {
            req.vendor = vendor;
          }
        } catch (vendorError) {
          console.error('Error fetching vendor context:', vendorError);
          // Don't fail the request if vendor fetch fails, just log it
        }
      }

      next();
    } catch (jwtError) {
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Firebase token required',
        code: 'NO_FIREBASE_TOKEN'
      });
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        phone: decodedToken.phone_number,
        email: decodedToken.email
      };
      next();
    } catch (firebaseError) {
      return res.status(403).json({
        error: 'Invalid Firebase token',
        code: 'INVALID_FIREBASE_TOKEN'
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Firebase authentication error',
      code: 'FIREBASE_AUTH_ERROR'
    });
  }
};

/**
 * Middleware to require vendor profile
 * Must be used after authenticateToken
 */
export const requireVendor = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    // Check if vendor context exists
    if (!req.vendor) {
      return res.status(403).json({
        error: 'Vendor profile required',
        message: 'Please complete your vendor profile setup',
        code: 'NO_VENDOR_PROFILE'
      });
    }

    // Check if vendor is active
    if (!req.vendor.isActive) {
      return res.status(403).json({
        error: 'Vendor account is inactive',
        message: 'Your vendor account has been deactivated',
        code: 'INACTIVE_VENDOR'
      });
    }

    next();
  } catch (error) {
    console.error('Vendor requirement error:', error);
    return res.status(500).json({
      error: 'Vendor verification failed',
      code: 'VENDOR_CHECK_ERROR'
    });
  }
};

