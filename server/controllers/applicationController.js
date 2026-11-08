const fs = require('fs');
const Job = require('../models/Job');
const Application = require('../models/Application');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { APPLICATION_STATUSES } = require('../utils/constants');
const { createNotification } = require('./notificationController');
const { safeResumePath } = require('./userController');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = (value) => new RegExp(escapeRegex(value), 'i');

async function attachProfiles(applications) {
  const ids = [...new Set(applications.map((a) => (a.jobSeeker && a.jobSeeker._id ? a.jobSeeker._id.toString() : a.jobSeeker && a.jobSeeker.toString())))];
  const profiles = await JobSeekerProfile.find({ user: { $in: ids } });
  const map = new Map(profiles.map((p) => [p.user.toString(), p]));
  return applications.map((app) => {
    const obj = app.toObject ? app.toObject() : app;
    const seekerId = obj.jobSeeker && obj.jobSeeker._id ? obj.jobSeeker._id.toString() : String(obj.jobSeeker);
    obj.seekerProfile = map.get(seekerId) ? map.get(seekerId).toObject() : null;
    return obj;
  });
}

const applyToJob = asyncHandler(async (req, res) => {
  const jobId = req.body.jobId || req.params.jobId;
  if (!jobId) return res.status(422).json({ success: false, message: 'Job ID is required.' });

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
  if (job.status !== 'approved' || !job.isActive) {
    return res.status(400).json({ success: false, message: 'This job is not currently open for applications.' });
  }
  if (job.applicationDeadline.getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'The application deadline for this job has passed.' });
  }

  const profile = await JobSeekerProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(400).json({ success: false, message: 'Please complete your profile first.' });

  const missing = [];
  if (!profile.fullName) missing.push('Full Name');
  if (!profile.phone) missing.push('Phone Number');
  if (!profile.state) missing.push('State');
  if (!profile.city) missing.push('City');
  if (!profile.education) missing.push('Education');
  if (missing.length) {
    return res.status(400).json({
      success: false,
      code: 'PROFILE_INCOMPLETE',
      message: `Please complete your profile before applying. Missing: ${missing.join(', ')}.`,
      missing,
    });
  }

  if (job.sector === 'private' && (!profile.resume || !profile.resume.filename)) {
    return res.status(400).json({
      success: false,
      code: 'RESUME_REQUIRED',
      message: 'Please upload a resume before applying for private jobs.',
    });
  }

  if (job.sector === 'government') {
    const officialWebsite = job.government && job.government.officialWebsite;
    if (officialWebsite && req.body.viaOfficialSite !== true) {
      return res.status(400).json({
        success: false,
        code: 'OFFICIAL_SITE_REQUIRED',
        message:
          'Government applications must be completed on the official recruitment website. After completing your official application, confirm here to track it in JobSeeker.',
        officialWebsite,
        notificationPdf: (job.government && job.government.notificationPdf) || '',
      });
    }
  }

  const existing = await Application.findOne({ job: job._id, jobSeeker: req.user._id });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'You have already applied for this job.',
      applicationId: existing._id,
    });
  }

  const application = await Application.create({
    job: job._id,
    jobSeeker: req.user._id,
    employer: job.employer,
    resume: profile.resume ? JSON.parse(JSON.stringify(profile.resume)) : undefined,
    coverLetter: req.body.coverLetter || '',
    status: 'Submitted',
  });

  await Promise.all([
    createNotification({
      user: req.user._id,
      type: 'application_submitted',
      title: 'Application submitted',
      message: `Your application for "${job.title}" at ${job.companyName || 'the employer'} was submitted successfully.`,
      link: '/dashboard/applications',
    }),
    createNotification({
      user: job.employer,
      type: 'system',
      title: 'New job application',
      message: `${profile.fullName || req.user.name} applied for "${job.title}".`,
      link: '/employer/applicants',
    }),
  ]);

  return res.status(201).json({ success: true, message: 'Application submitted successfully.', application });
});

const myApplications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const query = { jobSeeker: req.user._id };

  if (req.query.status && APPLICATION_STATUSES.includes(req.query.status)) query.status = req.query.status;

  if (req.query.q) {
    const rx = regex(req.query.q);
    const jobs = await Job.find({ $or: [{ title: rx }, { companyName: rx }] }).select('_id');
    query.job = { $in: jobs.map((j) => j._id) };
  }

  const [applications, total, statusCounts] = await Promise.all([
    Application.find(query)
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('job', 'title companyName sector jobType workMode location applicationDeadline status isActive salaryMin salaryMax salaryText')
      .populate('employer', 'name email'),
    Application.countDocuments(query),
    Application.aggregate([{ $match: { jobSeeker: req.user._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const counts = { Submitted: 0, 'Under Review': 0, Shortlisted: 0, Rejected: 0, Hired: 0 };
  statusCounts.forEach((item) => {
    counts[item._id] = item.count;
  });

  res.json({
    success: true,
    applications,
    counts,
    totalApplications: Object.values(counts).reduce((a, b) => a + b, 0),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('job', 'title companyName sector jobType workMode location applicationDeadline government status')
    .populate('jobSeeker', 'name email phone')
    .populate('employer', 'name email');

  if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });

  const isOwner = application.jobSeeker._id.toString() === req.user._id.toString();
  const isEmployer = application.employer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isEmployer && !isAdmin) {
    return res.status(403).json({ success: false, message: 'You are not allowed to view this application.' });
  }

  const data = application.toObject();
  if (isEmployer || isAdmin) {
    const profile = await JobSeekerProfile.findOne({ user: application.jobSeeker._id });
    data.seekerProfile = profile ? profile.toObject() : null;
  }

  return res.json({ success: true, application: data });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!APPLICATION_STATUSES.includes(status)) {
    return res.status(422).json({ success: false, message: 'Invalid application status.' });
  }

  const application = await Application.findById(req.params.id).populate('job', 'title companyName employer');
  if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });

  const isEmployer = application.employer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isEmployer && !isAdmin) {
    return res.status(403).json({ success: false, message: 'You can only update applications for your own jobs.' });
  }

  application.status = status;
  application.statusHistory.push({ status, changedBy: req.user._id, note: note || '', changedAt: new Date() });
  await application.save();

  const typeMap = {
    Shortlisted: 'shortlisted',
    Rejected: 'rejected',
    Hired: 'hired',
  };
  await createNotification({
    user: application.jobSeeker,
    type: typeMap[status] || 'application_status',
    title: `Application status updated: ${status}`,
    message: `Your application for "${application.job.title}" at ${application.job.companyName || 'the employer'} is now "${status}".`,
    link: '/dashboard/applications',
  });

  return res.json({ success: true, message: `Application status updated to ${status}.`, application });
});

const downloadApplicationResume = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate('jobSeeker', 'name');
  if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });

  const isOwner = application.jobSeeker._id.toString() === req.user._id.toString();
  const isEmployer = application.employer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isEmployer && !isAdmin) {
    return res.status(403).json({ success: false, message: 'You are not allowed to download this resume.' });
  }

  if (!application.resume || !application.resume.path) {
    return res.status(404).json({ success: false, message: 'No resume attached to this application.' });
  }

  const absolute = safeResumePath(application.resume.path);
  if (!absolute || !fs.existsSync(absolute)) {
    return res.status(404).json({ success: false, message: 'Resume file could not be found.' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.download(absolute, application.resume.originalName || 'resume.pdf');
});

async function listApplicants(req, res, extraFilter = {}) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const query = { ...extraFilter };

  if (req.query.status && APPLICATION_STATUSES.includes(req.query.status)) query.status = req.query.status;
  if (req.query.jobId) query.job = req.query.jobId;

  if (req.query.q) {
    const rx = regex(req.query.q);
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id');
    query.jobSeeker = { $in: users.map((u) => u._id) };
  }

  const [applications, total, statusCounts] = await Promise.all([
    Application.find(query)
      .sort({ appliedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('job', 'title companyName sector jobType location')
      .populate('jobSeeker', 'name email phone'),
    Application.countDocuments(query),
    Application.aggregate([{ $match: extraFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const withProfiles = await attachProfiles(applications);
  const counts = { Submitted: 0, 'Under Review': 0, Shortlisted: 0, Rejected: 0, Hired: 0 };
  statusCounts.forEach((item) => {
    counts[item._id] = item.count;
  });

  return res.json({
    success: true,
    applications: withProfiles,
    counts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

const employerApplicants = asyncHandler((req, res) => listApplicants(req, res, { employer: req.user._id }));

const jobApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
  const isOwner = job.employer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You can only view applicants for your own jobs.' });
  }
  return listApplicants(req, res, { job: job._id });
});

const adminApplications = asyncHandler(async (req, res) => {
  const extra = {};
  if (req.query.sector && ['private', 'government'].includes(req.query.sector)) {
    const jobs = await Job.find({ sector: req.query.sector }).select('_id');
    extra.job = { $in: jobs.map((j) => j._id) };
  }
  return listApplicants(req, res, extra);
});

module.exports = {
  applyToJob,
  myApplications,
  getApplication,
  updateStatus,
  downloadApplicationResume,
  employerApplicants,
  jobApplicants,
  adminApplications,
};
