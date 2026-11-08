const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const EmployerProfile = require('../models/EmployerProfile');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../middleware/asyncHandler');
const { createNotification, createManyNotifications } = require('./notificationController');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = (value) => new RegExp(escapeRegex(value), 'i');

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

async function notifyMatchingJobSeekers(job) {
  const or = [];
  if (job.location && job.location.state) or.push({ state: job.location.state });
  if (job.skills && job.skills.length) or.push({ skills: { $in: job.skills.map((skill) => regex(skill)) } });
  if (!or.length) return;

  const profiles = await JobSeekerProfile.find({ $or: or }).select('user').limit(300);
  if (!profiles.length) return;

  await createManyNotifications(
    profiles.map((profile) => ({
      user: profile.user,
      type: 'new_job',
      title: 'New job matching your profile',
      message: `${job.title} at ${job.companyName || 'a company'} is now open.`,
      link: `/jobs/${job._id}`,
    }))
  );
}

const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const [
    totalUsers,
    totalJobSeekers,
    totalEmployers,
    totalAdmins,
    totalJobs,
    totalPrivateJobs,
    totalGovernmentJobs,
    pendingApprovals,
    activeJobs,
    expiredJobs,
    totalApplications,
    applicationStatusAgg,
    pendingGovVerification,
    recentUsers,
    recentJobs,
    recentApplications,
    unreadMessages,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'jobseeker' }),
    User.countDocuments({ role: 'employer' }),
    User.countDocuments({ role: 'admin' }),
    Job.countDocuments(),
    Job.countDocuments({ sector: 'private' }),
    Job.countDocuments({ sector: 'government' }),
    Job.countDocuments({ status: 'pending' }),
    Job.countDocuments({ status: 'approved', isActive: true, applicationDeadline: { $gte: now } }),
    Job.countDocuments({ status: 'approved', applicationDeadline: { $lt: now } }),
    Application.countDocuments(),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Job.countDocuments({ sector: 'government', 'government.isVerified': false, status: { $in: ['pending', 'approved'] } }),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role isActive createdAt'),
    Job.find().sort({ createdAt: -1 }).limit(5).populate('employer', 'name email'),
    Application.find().sort({ appliedAt: -1 }).limit(5).populate('job', 'title companyName').populate('jobSeeker', 'name email'),
    ContactMessage.countDocuments({ isRead: false }),
  ]);

  const applicationCounts = { Submitted: 0, 'Under Review': 0, Shortlisted: 0, Rejected: 0, Hired: 0 };
  applicationStatusAgg.forEach((item) => {
    applicationCounts[item._id] = item.count;
  });

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalJobSeekers,
      totalEmployers,
      totalAdmins,
      totalJobs,
      totalPrivateJobs,
      totalGovernmentJobs,
      pendingApprovals,
      activeJobs,
      expiredJobs,
      totalApplications,
      pendingGovVerification,
      unreadMessages,
    },
    applicationCounts,
    recentUsers,
    recentJobs,
    recentApplications,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const query = {};

  if (req.query.role && ['jobseeker', 'employer', 'admin'].includes(req.query.role)) query.role = req.query.role;
  if (req.query.isActive === 'true' || req.query.isActive === 'false') query.isActive = req.query.isActive === 'true';
  if (req.query.q) {
    const rx = regex(req.query.q);
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(query),
  ]);

  const seekerIds = users.filter((u) => u.role === 'jobseeker').map((u) => u._id);
  const employerIds = users.filter((u) => u.role === 'employer').map((u) => u._id);
  const [seekerProfiles, employerProfiles] = await Promise.all([
    JobSeekerProfile.find({ user: { $in: seekerIds } }).select('user fullName state city education resume'),
    EmployerProfile.find({ user: { $in: employerIds } }).select('user companyName city state isVerified logo'),
  ]);

  const seekerMap = new Map(seekerProfiles.map((p) => [p.user.toString(), p]));
  const employerMap = new Map(employerProfiles.map((p) => [p.user.toString(), p]));

  const data = users.map((user) => {
    const safe = user.toSafeJSON();
    const profile =
      user.role === 'jobseeker' ? seekerMap.get(user._id.toString()) : employerMap.get(user._id.toString());
    return { ...safe, profile: profile ? profile.toObject() : null };
  });

  res.json({
    success: true,
    users: data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(422).json({ success: false, message: 'isActive must be true or false.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
  }

  if (user.role === 'admin' && isActive === false) {
    const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdmins <= 1) {
      return res.status(400).json({ success: false, message: 'At least one active admin account must remain.' });
    }
  }

  user.isActive = isActive;
  await user.save({ validateBeforeSave: false });

  await createNotification({
    user: user._id,
    type: 'system',
    title: isActive ? 'Account activated' : 'Account deactivated',
    message: isActive
      ? 'Your JobSeeker account has been reactivated by an administrator.'
      : 'Your JobSeeker account has been deactivated by an administrator. Please contact support for assistance.',
  });

  return res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`, user: user.toSafeJSON() });
});

const getEmployers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const query = {};
  if (req.query.q) query.companyName = regex(req.query.q);
  if (req.query.verified === 'true' || req.query.verified === 'false') query.isVerified = req.query.verified === 'true';

  const [profiles, total] = await Promise.all([
    EmployerProfile.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email phone isActive createdAt'),
    EmployerProfile.countDocuments(query),
  ]);

  const ids = profiles.map((p) => p.user && p.user._id).filter(Boolean);
  const counts = await Job.aggregate([
    { $match: { employer: { $in: ids } } },
    {
      $group: {
        _id: '$employer',
        totalJobs: { $sum: 1 },
        activeJobs: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$status', 'approved'] }, { $eq: ['$isActive', true] }] }, 1, 0],
          },
        },
      },
    },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c]));

  const employers = profiles.map((profile) => {
    const obj = profile.toObject();
    const count = profile.user ? countMap.get(profile.user._id.toString()) : null;
    return { ...obj, totalJobs: count ? count.totalJobs : 0, activeJobs: count ? count.activeJobs : 0 };
  });

  res.json({
    success: true,
    employers,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const verifyEmployer = asyncHandler(async (req, res) => {
  const { isVerified, notes } = req.body;
  if (typeof isVerified !== 'boolean') {
    return res.status(422).json({ success: false, message: 'isVerified must be true or false.' });
  }

  const profile = await EmployerProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ success: false, message: 'Employer not found.' });

  profile.isVerified = isVerified;
  profile.verifiedAt = isVerified ? new Date() : null;
  profile.verificationNotes = notes || '';
  await profile.save();

  await createNotification({
    user: profile.user,
    type: isVerified ? 'employer_verified' : 'system',
    title: isVerified ? 'Company verified' : 'Company verification updated',
    message: isVerified
      ? `${profile.companyName} has been verified by JobSeeker. Your jobs now show a verified employer badge.`
      : `${profile.companyName} verification was removed by an administrator.${notes ? ` Notes: ${notes}` : ''}`,
    link: '/employer/profile',
  });

  return res.json({ success: true, message: `Employer ${isVerified ? 'verified' : 'unverified'} successfully.`, employer: profile });
});

const getJobs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const query = {};

  if (req.query.status && ['pending', 'approved', 'rejected', 'closed'].includes(req.query.status)) query.status = req.query.status;
  if (req.query.sector && ['private', 'government'].includes(req.query.sector)) query.sector = req.query.sector;
  if (req.query.isActive === 'true' || req.query.isActive === 'false') query.isActive = req.query.isActive === 'true';
  if (req.query.category) query.category = regex(req.query.category);
  if (req.query.verified === 'true') query['government.isVerified'] = true;
  if (req.query.verified === 'false') query['government.isVerified'] = false;
  if (req.query.expired === 'true') query.applicationDeadline = { $lt: new Date() };
  if (req.query.q) {
    const rx = regex(req.query.q);
    query.$or = [{ title: rx }, { companyName: rx }, { category: rx }, { 'government.organization': rx }];
  }

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employer', 'name email'),
    Job.countDocuments(query),
  ]);

  res.json({
    success: true,
    jobs: jobs.map((job) => job.toObject({ virtuals: true })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const approveJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
  if (job.applicationDeadline.getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'This job has already passed its application deadline and cannot be approved.' });
  }

  job.status = 'approved';
  job.isActive = true;
  job.approvedBy = req.user._id;
  job.approvedAt = new Date();
  job.rejectionReason = '';
  await job.save();

  await createNotification({
    user: job.employer,
    type: 'job_approved',
    title: 'Job approved',
    message: `Your job "${job.title}" has been approved and is now live on JobSeeker.`,
    link: '/employer/jobs',
  });

  await notifyMatchingJobSeekers(job);

  return res.json({ success: true, message: 'Job approved and published.', job: job.toObject({ virtuals: true }) });
});

const rejectJob = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

  job.status = 'rejected';
  job.isActive = false;
  job.rejectionReason = reason || 'The job did not meet our listing guidelines.';
  await job.save();

  await createNotification({
    user: job.employer,
    type: 'job_rejected',
    title: 'Job rejected',
    message: `Your job "${job.title}" was rejected. Reason: ${job.rejectionReason}`,
    link: '/employer/jobs',
  });

  return res.json({ success: true, message: 'Job rejected.', job: job.toObject({ virtuals: true }) });
});

const getGovernmentVerification = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const query = { sector: 'government' };

  if (req.query.verified === 'true' || req.query.verified === 'false') query['government.isVerified'] = req.query.verified === 'true';
  if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) query.status = req.query.status;
  if (req.query.q) {
    const rx = regex(req.query.q);
    query.$or = [{ title: rx }, { 'government.organization': rx }, { 'government.notificationNumber': rx }];
  }

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employer', 'name email'),
    Job.countDocuments(query),
  ]);

  res.json({
    success: true,
    jobs: jobs.map((job) => job.toObject({ virtuals: true })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const verifyGovernmentJob = asyncHandler(async (req, res) => {
  const { isVerified, notes, officialWebsite, notificationNumber, notificationPdf } = req.body;
  if (typeof isVerified !== 'boolean') {
    return res.status(422).json({ success: false, message: 'isVerified must be true or false.' });
  }

  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
  if (job.sector !== 'government') {
    return res.status(400).json({ success: false, message: 'Only government jobs can be verified through this endpoint.' });
  }

  const gov = job.government || {};
  if (officialWebsite !== undefined) {
    if (officialWebsite && !isHttpUrl(officialWebsite)) {
      return res.status(422).json({ success: false, message: 'Official website must be a valid http(s) URL.' });
    }
    gov.officialWebsite = officialWebsite;
  }
  if (notificationNumber !== undefined) gov.notificationNumber = notificationNumber;
  if (notificationPdf !== undefined) gov.notificationPdf = notificationPdf;

  if (isVerified) {
    if (!gov.officialWebsite || !isHttpUrl(gov.officialWebsite)) {
      return res.status(422).json({
        success: false,
        message: 'A valid official application website URL is required before a government job can be verified.',
      });
    }
    if (!gov.notificationNumber && !gov.notificationPdf) {
      return res.status(422).json({
        success: false,
        message: 'Provide the official notification number or upload the official notification PDF before verifying.',
      });
    }
    gov.isVerified = true;
    gov.verifiedBy = req.user._id;
    gov.verifiedAt = new Date();
  } else {
    gov.isVerified = false;
    gov.verifiedBy = null;
    gov.verifiedAt = null;
  }
  gov.verificationNotes = notes || '';
  job.government = gov;
  await job.save();

  await createNotification({
    user: job.employer,
    type: isVerified ? 'job_approved' : 'system',
    title: isVerified ? 'Government vacancy verified' : 'Government vacancy verification removed',
    message: isVerified
      ? `The government vacancy "${job.title}" has been verified against its official notification.`
      : `Verification was removed for "${job.title}".${notes ? ` Notes: ${notes}` : ''}`,
    link: '/employer/jobs',
  });

  return res.json({
    success: true,
    message: isVerified ? 'Government vacancy verified successfully.' : 'Government vacancy marked as unverified.',
    job: job.toObject({ virtuals: true }),
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const query = {};
  if (req.query.isRead === 'true' || req.query.isRead === 'false') query.isRead = req.query.isRead === 'true';

  const [messages, total] = await Promise.all([
    ContactMessage.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ContactMessage.countDocuments(query),
  ]);

  res.json({
    success: true,
    messages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const updateMessageStatus = asyncHandler(async (req, res) => {
  const { isRead } = req.body;
  if (typeof isRead !== 'boolean') {
    return res.status(422).json({ success: false, message: 'isRead must be true or false.' });
  }
  const message = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead }, { new: true });
  if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });
  return res.json({ success: true, message: 'Message updated.', data: message });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });
  return res.json({ success: true, message: 'Message deleted.' });
});

module.exports = {
  getDashboard,
  getUsers,
  updateUserStatus,
  getEmployers,
  verifyEmployer,
  getJobs,
  approveJob,
  rejectJob,
  getGovernmentVerification,
  verifyGovernmentJob,
  getMessages,
  updateMessageStatus,
  deleteMessage,
};
