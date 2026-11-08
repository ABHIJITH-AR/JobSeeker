const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const asyncHandler = require('../middleware/asyncHandler');

const listSavedJobs = asyncHandler(async (req, res) => {
  const saved = await SavedJob.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'job',
      select: 'title companyName companyLogo sector category jobType workMode location salaryMin salaryMax salaryText applicationDeadline status isActive postedDate government',
    });

  const jobs = saved
    .filter((item) => item.job)
    .map((item) => {
      const job = item.job.toObject({ virtuals: true });
      return { savedId: item._id, savedAt: item.createdAt, ...job };
    });

  res.json({ success: true, jobs });
});

const saveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
  if (job.status !== 'approved' || !job.isActive) {
    return res.status(400).json({ success: false, message: 'Only active approved jobs can be saved.' });
  }

  const existing = await SavedJob.findOne({ user: req.user._id, job: job._id });
  if (existing) return res.json({ success: true, message: 'Job is already saved.', savedJob: existing });

  const savedJob = await SavedJob.create({ user: req.user._id, job: job._id });
  return res.status(201).json({ success: true, message: 'Job saved successfully.', savedJob });
});

const removeSavedJob = asyncHandler(async (req, res) => {
  const removed = await SavedJob.findOneAndDelete({ user: req.user._id, job: req.params.jobId });
  if (!removed) return res.status(404).json({ success: false, message: 'Saved job not found.' });
  return res.json({ success: true, message: 'Job removed from saved list.' });
});

const checkSavedJob = asyncHandler(async (req, res) => {
  const saved = await SavedJob.findOne({ user: req.user._id, job: req.params.jobId }).select('_id');
  res.json({ success: true, isSaved: Boolean(saved) });
});

module.exports = { listSavedJobs, saveJob, removeSavedJob, checkSavedJob };
