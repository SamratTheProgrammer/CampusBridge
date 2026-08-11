import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    logo: {
      type: String,
    },
    location: {
      type: String,
      required: true,
    },
    employees: {
      type: String,
      default: '10-50',
    },
    website: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Partner', 'Pending', 'Rejected'],
      default: 'Pending',
    },
    active: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

const Company = mongoose.model('Company', companySchema);

export default Company;
