import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const ADMIN_SECRET = process.env.CLERK_SECRET_KEY || process.env.ADMIN_PASSWORD || 'campusbridge_secure_admin_secret_key_2026';

/**
 * Generate a cryptographically signed admin token with HMAC-SHA256 signature
 */
export const generateAdminToken = (adminData) => {
  const payload = Buffer.from(JSON.stringify({
    ...adminData,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

/**
 * Verify signed admin token and expiration
 */
export const verifyAdminToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url');

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSig.length) return null;
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && Date.now() > data.exp) return null; // Token expired
    return data;
  } catch (err) {
    return null;
  }
};

/**
 * Express middleware to guard admin-only routes
 */
export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Admin authentication token required'
    });
  }

  const adminUser = verifyAdminToken(token);
  if (!adminUser) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired admin session token'
    });
  }

  req.admin = adminUser;
  next();
};
