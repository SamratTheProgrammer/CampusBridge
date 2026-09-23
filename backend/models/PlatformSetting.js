import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema(
  {
    globalTheme: {
      type: String,
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
      sessionTimeoutUnit: { type: String, default: 'days' },
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
    },
    appBannerSettings: {
      showLandingAnnouncement: { type: Boolean, default: true },
      showDashboardBanner: { type: Boolean, default: true },
      announcementText: { type: String, default: '🚀 CampusBridge Mobile App is now officially live on Android & iOS!' },
      apkDownloadUrl: { type: String, default: 'https://campus-bridge-x5rl.vercel.app/downloads/CampusBridge.apk' },
      appVersion: { type: String, default: 'v1.0.0' }
    }
  },
  { timestamps: true }
);

const PlatformSetting = mongoose.model('PlatformSetting', platformSettingSchema);

export default PlatformSetting;
