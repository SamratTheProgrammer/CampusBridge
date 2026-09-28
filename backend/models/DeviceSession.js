import mongoose from 'mongoose';

const deviceSessionSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      index: true,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'desktop',
    },
    deviceName: {
      type: String,
      default: 'Unknown Device',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    browserVersion: {
      type: String,
      default: '',
    },
    os: {
      type: String,
      default: 'Unknown OS',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    region: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      deviceName: String,
      browser: String,
      os: String,
      ipAddress: String,
      city: String,
      country: String,
      revokedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active sessions by clerkId
deviceSessionSchema.index({ clerkId: 1, status: 1 });
deviceSessionSchema.index({ clerkId: 1, sessionId: 1 });

const DeviceSession = mongoose.model('DeviceSession', deviceSessionSchema);

export default DeviceSession;
