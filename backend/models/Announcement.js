import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    details: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    audience: {
      type: String,
      enum: ['All Users', 'Students', 'Mentors'],
      default: 'All Users'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['Published', 'Paused'],
      default: 'Published'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Announcement', announcementSchema);
