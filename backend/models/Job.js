import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    companyLogo: {
      type: String, // URL to company logo
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String, // e.g., 'Full-time', 'Internship', 'Contract'
      required: true,
    },
    salary: {
      type: String, // e.g., '₹80,000 / month'
    },
    description: {
      type: String,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    status: {
      type: String,
      enum: ['Approved', 'Pending', 'Rejected'],
      default: 'Approved',
    },
    active: {
      type: Boolean,
      default: true,
    },
    deadline: {
      type: Date,
    },
    notifiedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    reminderSent: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
