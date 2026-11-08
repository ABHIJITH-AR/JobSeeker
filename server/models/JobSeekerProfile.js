const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    storedName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const jobSeekerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, trim: true, maxlength: 80, default: '' },
    profilePhoto: { type: String, default: '' },
    phone: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date, default: null },
    address: { type: String, trim: true, maxlength: 300, default: '' },
    state: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    education: { type: String, trim: true, default: '' },
    collegeName: { type: String, trim: true, default: '' },
    graduationYear: { type: Number, default: null, min: 1950, max: 2100 },
    skills: { type: [String], default: [] },
    experience: { type: String, trim: true, default: '' },
    careerObjective: { type: String, trim: true, maxlength: 1000, default: '' },
    resume: { type: fileSchema, default: null },
  },
  { timestamps: true }
);

jobSeekerProfileSchema.methods.completion = function completion() {
  const fields = [
    this.fullName,
    this.phone,
    this.state,
    this.district,
    this.city,
    this.education,
    this.skills && this.skills.length,
    this.careerObjective,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
};

module.exports = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);
