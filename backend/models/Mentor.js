import mongoose from 'mongoose';

const mentorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
    },
    position: {
      type: String,
    },
    experienceYears: {
      type: Number,
    },
    skills: [
      {
        type: String,
      },
    ],
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Mentor = mongoose.model('Mentor', mentorSchema);

export default Mentor;
