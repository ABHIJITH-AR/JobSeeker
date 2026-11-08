const mongoose = require('mongoose');

const APPLICATION_STATUSES = ['Submitted', 'Under Review', 'Shortlisted', 'Rejected', 'Hired'];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    jobSeeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resume: {
      filename: String,
      originalName: String,
      storedName: String,
      path: String,
      mimetype: String,
      size: Number,
    },
    coverLetter: { type: String, trim: true, maxlength: 3000, default: '' },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'Submitted',
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    appliedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, jobSeeker: 1 }, { unique: true });
applicationSchema.index({ employer: 1, status: 1 });

applicationSchema.pre('save', function pushHistory(next) {
  if (this.isNew) {
    this.statusHistory = [{ status: this.status, changedBy: this.jobSeeker, changedAt: new Date() }];
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
