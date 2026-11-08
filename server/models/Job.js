const mongoose = require('mongoose');

const JOB_TYPES = ['Full Time', 'Part Time', 'Internship', 'Contract', 'Work From Home'];
const WORK_MODES = ['On-site', 'Remote', 'Hybrid', 'Work From Home'];
const SECTORS = ['private', 'government'];
const STATUSES = ['pending', 'approved', 'rejected', 'closed'];

const jobSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sector: {
      type: String,
      enum: SECTORS,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 160,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      maxlength: 12000,
    },
    responsibilities: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    qualification: { type: String, trim: true, default: '' },
    experience: { type: String, trim: true, default: '' },
    experienceMin: { type: Number, default: 0, min: 0, max: 60 },
    salaryMin: { type: Number, default: null, min: 0 },
    salaryMax: { type: Number, default: null, min: 0 },
    salaryPeriod: {
      type: String,
      enum: ['month', 'year'],
      default: 'month',
    },
    salaryText: { type: String, trim: true, default: '' },
    jobType: {
      type: String,
      enum: JOB_TYPES,
      default: 'Full Time',
      index: true,
    },
    workMode: {
      type: String,
      enum: WORK_MODES,
      default: 'On-site',
      index: true,
    },
    location: {
      state: { type: String, trim: true, default: '', index: true },
      district: { type: String, trim: true, default: '', index: true },
      city: { type: String, trim: true, default: '', index: true },
      pincode: { type: String, trim: true, default: '' },
    },
    vacancies: { type: Number, default: 1, min: 1, max: 1000000 },
    postedDate: { type: Date, default: Date.now, index: true },
    applicationDeadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
      index: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'pending',
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    views: { type: Number, default: 0 },

    // Company snapshot for private jobs / recruiting organization for government jobs
    companyName: { type: String, trim: true, default: '' },
    companyLogo: { type: String, default: '' },

    // Government-specific fields
    government: {
      organization: { type: String, trim: true, default: '' },
      department: { type: String, trim: true, default: '' },
      notificationNumber: { type: String, trim: true, default: '' },
      postName: { type: String, trim: true, default: '' },
      ageLimit: { type: String, trim: true, default: '' },
      eligibility: { type: String, trim: true, default: '' },
      payScale: { type: String, trim: true, default: '' },
      applicationStartDate: { type: Date, default: null },
      examDate: { type: Date, default: null },
      selectionProcess: { type: String, trim: true, default: '' },
      applicationFee: { type: String, trim: true, default: '' },
      notificationPdf: { type: String, default: '' },
      officialWebsite: { type: String, trim: true, default: '' },
      isVerified: { type: Boolean, default: false, index: true },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      verifiedAt: { type: Date, default: null },
      verificationNotes: { type: String, trim: true, default: '' },
    },

    adminNotes: { type: String, trim: true, default: '' },
    rejectionReason: { type: String, trim: true, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

jobSchema.index({ title: 'text', description: 'text', skills: 'text', companyName: 'text', 'government.organization': 'text' });
jobSchema.index({ sector: 1, status: 1, applicationDeadline: -1 });
jobSchema.index({ 'location.state': 1, 'location.district': 1, 'location.city': 1 });

jobSchema.virtual('isExpired').get(function isExpired() {
  return Boolean(this.applicationDeadline && this.applicationDeadline.getTime() < Date.now());
});

jobSchema.virtual('isOpen').get(function isOpen() {
  return (
    this.status === 'approved' &&
    this.isActive === true &&
    this.applicationDeadline &&
    this.applicationDeadline.getTime() >= Date.now()
  );
});

jobSchema.methods.publicJSON = function publicJSON() {
  const obj = this.toObject({ virtuals: true });
  if (obj.sector === 'government' && obj.government) {
    // Never expose verification internals publicly
    delete obj.government.verifiedBy;
    delete obj.government.verificationNotes;
  }
  delete obj.adminNotes;
  delete obj.rejectionReason;
  return obj;
};

module.exports = mongoose.model('Job', jobSchema);
module.exports.JOB_TYPES = JOB_TYPES;
module.exports.WORK_MODES = WORK_MODES;
module.exports.SECTORS = SECTORS;
module.exports.STATUSES = STATUSES;
