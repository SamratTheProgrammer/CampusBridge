import mongoose from 'mongoose';

const platformSettingSchema = new mongoose.Schema(
  {
    globalTheme: {
      type: String,
      enum: ['system', 'none', 'diwali', 'holi', 'independence'],
      default: 'none',
    },
    // Can add other global settings here in the future
  },
  { timestamps: true }
);

const PlatformSetting = mongoose.model('PlatformSetting', platformSettingSchema);

export default PlatformSetting;
