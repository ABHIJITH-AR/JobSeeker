const mongoose = require('mongoose');

const employerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: { type: String, trim: true, required: true, maxlength: 150 },
    companyEmail: { type: String, trim: true, lowercase: true, default: '' },
    contactNumber: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    companySize: { type: String, trim: true, default: '' },
    foundedYear: { type: Number, default: null, min: 1800, max: 2100 },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    state: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    logo: { type: String, default: '' },
    isVerified: { type: Boolean, default: false, index: true },
    verifiedAt: { type: Date, default: null },
    verificationNotes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployerProfile', employerProfileSchema);
