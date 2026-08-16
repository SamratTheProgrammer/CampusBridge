import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema(
  {
    globalTheme: {
      type: String,
      enum: ['system', 'none', 'diwali', 'holi', 'independence'],
      default: 'none',
    },
    authSettings: {
      allowSignups: { type: Boolean, default: true },
      requireEmailVerification: { type: Boolean, default: true },
      enableGoogleAuth: { type: Boolean, default: true }
    },
    emailSettings: {
      enableEmailNotifications: { type: Boolean, default: true },
      enablePushNotifications: { type: Boolean, default: true },
      notifyOnNewJobPost: { type: Boolean, default: true },
      notifyOnNewEvent: { type: Boolean, default: true },
      senderEmailAddress: { type: String, default: 'noreply@campusbridge.com' }
    },
    securitySettings: {
      requireTwoFactorAuth: { type: Boolean, default: false },
      enforceStrongPasswords: { type: Boolean, default: true },
      sessionTimeoutValue: { type: Number, default: 60 },
      sessionTimeoutUnit: { type: String, enum: ['minutes', 'days', 'months'], default: 'minutes' },
      maxFailedLoginAttempts: { type: Number, default: 5 },
      allowedIPRanges: { type: String, default: '' }
    },
    privacySettings: {
      requireCookieConsent: { type: Boolean, default: true },
      allowAnalyticsTracking: { type: Boolean, default: true },
      dataRetentionDays: { type: Number, default: 365 },
      displayUserProfilesPublicly: { type: Boolean, default: false }
    },
    integrationSettings: {
      enableZoomIntegration: { type: Boolean, default: false },
      enableGoogleCalendar: { type: Boolean, default: false },
      googleAnalyticsTrackingId: { type: String, default: '' },
      slackWebhookUrl: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

const PlatformSetting = mongoose.model('PlatformSetting', platformSettingSchema);

export default PlatformSetting;
