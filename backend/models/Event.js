import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    imageUrl: {
      type: String,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    type: {
      type: String, // e.g., 'Workshop', 'Masterclass'
    },
    mode: {
      type: String,
      enum: ['Online', 'Offline'],
      default: 'Online',
    },
    time: {
      type: String,
    },
    link: {
      type: String,
    },
    category: {
      type: String,
      enum: ['event', 'session'],
      default: 'event',
    },
    active: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;
