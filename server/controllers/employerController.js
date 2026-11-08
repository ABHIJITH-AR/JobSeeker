const fs = require('fs');
const path = require('path');
const EmployerProfile = require('../models/EmployerProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const asyncHandler = require('../middleware/asyncHandler');
const { cleanupFile } = require('../middleware/upload');
const { STATES } = require('../data/indiaLocations');

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

const getProfile = asyncHandler(async (req, res) => {
  const profile = await EmployerProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ success: false, message: 'Company profile not found.' });
  return res.json({ success: true, user: req.user.toSafeJSON(), profile });
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await EmployerProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ success: false, message: 'Company profile not found.' });

  const allowed = [
    'companyName',
    'companyEmail',
    'contactNumber',
    'website',
    'industry',
    'companySize',
    'address',
    'state',
    'district',
    'city',
    'description',
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });

  if (req.body.foundedYear !== undefined) {
    profile.foundedYear = req.body.foundedYear ? Number(req.body.foundedYear) : null;
  }
  if (profile.website && !isHttpUrl(profile.website)) {
    cleanupFile(req.file);
    return res.status(422).json({ success: false, message: 'Website must be a valid http(s) URL.' });
  }
  if (profile.state && !STATES.includes(profile.state)) {
    cleanupFile(req.file);
    return res.status(422).json({ success: false, message: 'Please select a valid Indian state or union territory.' });
  }

  if (req.file) {
    if (profile.logo && profile.logo.startsWith('/uploads/logos/')) {
      const oldPath = path.join(__dirname, '..', profile.logo.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (err) {
          // ignore
        }
      }
    }
    profile.logo = `/uploads/logos/${req.file.filename}`;
  }

  await profile.save();
  return res.json({ success: true, message: 'Company profile updated successfully.', profile });
});

const getDashboard = asyncHandler(async (req, res) => {
  const [totalJobs, activeJobs, pendingJobs, approvedJobs, totalApplicants, pendingApplications, recentApplications, recentJobs] =
    await Promise.all([
      Job.countDocuments({ employer: req.user._id }),
      Job.countDocuments({ employer: req.user._id, isActive: true, status: 'approved', applicationDeadline: { $gte: new Date() } }),
      Job.countDocuments({ employer: req.user._id, status: 'pending' }),
      Job.countDocuments({ employer: req.user._id, status: 'approved' }),
      Application.countDocuments({ employer: req.user._id }),
      Application.countDocuments({ employer: req.user._id, status: { $in: ['Submitted', 'Under Review'] } }),
      Application.find({ employer: req.user._id })
        .sort({ appliedAt: -1 })
        .limit(5)
        .populate('job', 'title')
        .populate('jobSeeker', 'name email'),
      Job.find({ employer: req.user._id }).sort({ createdAt: -1 }).limit(5),
    ]);

  res.json({
    success: true,
    stats: { totalJobs, activeJobs, pendingJobs, approvedJobs, totalApplicants, pendingApplications },
    recentApplications,
    recentJobs,
  });
});

const getJobs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const query = { employer: req.user._id };

  if (req.query.status && ['pending', 'approved', 'rejected', 'closed'].includes(req.query.status)) {
    query.status = req.query.status;
  }
  if (req.query.q) {
    const escaped = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [{ title: new RegExp(escaped, 'i') }, { category: new RegExp(escaped, 'i') }];
  }

  const [jobs, total] = await Promise.all([
    Job.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Job.countDocuments(query),
  ]);

  res.json({
    success: true,
    jobs: jobs.map((job) => job.publicJSON()),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

module.exports = { getProfile, updateProfile, getDashboard, getJobs };
