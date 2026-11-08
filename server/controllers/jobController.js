const Job = require('../models/Job');
const EmployerProfile = require('../models/EmployerProfile');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { cleanupFile } = require('../middleware/upload');
const { STATES } = require('../data/indiaLocations');
const {
  PRIVATE_CATEGORIES,
  GOVERNMENT_CATEGORIES,
  QUALIFICATIONS,
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  WORK_MODES,
} = require('../utils/constants');
const { createNotification, createManyNotifications } = require('./notificationController');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = (value) => new RegExp(escapeRegex(value), 'i');

function parseArray(value) {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  const str = String(value).trim();
  if (!str) return [];
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch (err) {
      // fall through to comma split
    }
  }
  return str
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseObject(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

function buildJobFilter(query, forcedSector) {
  const filter = {};

  const includeExpired = query.includeExpired === 'true';
  filter.status = 'approved';
  filter.isActive = true;
  if (!includeExpired) filter.applicationDeadline = { $gte: new Date() };

  const sector = forcedSector || (['private', 'government'].includes(query.sector) ? query.sector : null);
  if (sector) filter.sector = sector;

  if (query.category) filter.category = regex(query.category);
  if (query.jobType) filter.jobType = query.jobType;
  if (query.workMode) filter.workMode = query.workMode;

  if (query.state && query.state !== 'All India') filter['location.state'] = regex(query.state);
  if (query.district) filter['location.district'] = regex(query.district);
  if (query.city) filter['location.city'] = regex(query.city);

  if (query.remote === 'true') {
    filter.$and = filter.$and || [];
    filter.$and.push({ $or: [{ workMode: { $in: ['Remote', 'Work From Home'] } }, { jobType: 'Work From Home' }] });
  }

  if (query.qualification) filter.qualification = regex(query.qualification);
  if (query.experience) filter.experience = regex(query.experience);

  const minSalary = parseNumber(query.minSalary);
  if (minSalary !== null) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [{ salaryMax: { $gte: minSalary } }, { salaryMin: { $gte: minSalary } }],
    });
  }
  const maxSalary = parseNumber(query.maxSalary);
  if (maxSalary !== null) {
    filter.$and = filter.$and || [];
    filter.$and.push({ $or: [{ salaryMin: { $lte: maxSalary } }, { salaryMin: null }] });
  }

  const deadlineWithin = parseNumber(query.deadlineWithinDays);
  if (deadlineWithin !== null) {
    const now = new Date();
    const until = new Date(now.getTime() + deadlineWithin * 24 * 60 * 60 * 1000);
    filter.applicationDeadline = { ...(filter.applicationDeadline || {}), $lte: until };
  }

  const postedWithin = parseNumber(query.postedWithinDays);
  if (postedWithin !== null) {
    filter.postedDate = { $gte: new Date(Date.now() - postedWithin * 24 * 60 * 60 * 1000) };
  }

  if (query.vacanciesMin) {
    const min = parseNumber(query.vacanciesMin);
    if (min !== null) filter.vacancies = { $gte: min };
  }

  const keyword = query.q || query.keyword || query.search;
  if (keyword && String(keyword).trim()) {
    const rx = regex(String(keyword).trim());
    const or = [
      { title: rx },
      { description: rx },
      { skills: rx },
      { category: rx },
      { companyName: rx },
      { qualification: rx },
      { 'location.city': rx },
      { 'location.state': rx },
      { 'government.organization': rx },
      { 'government.department': rx },
      { 'government.postName': rx },
    ];
    filter.$and = (filter.$and || []).concat([{ $or: or }]);
  }

  if (query.title) filter.title = regex(query.title);
  if (query.company) filter.companyName = regex(query.company);
  if (query.department) filter['government.department'] = regex(query.department);

  if (query.skills) {
    const skillList = parseArray(query.skills) || [];
    if (skillList.length) {
      filter.$and = (filter.$and || []).concat(skillList.map((skill) => ({ skills: regex(skill) })));
    }
  }

  return filter;
}

function buildSort(sort) {
  switch (sort) {
    case 'oldest':
      return { postedDate: 1 };
    case 'salary':
    case 'salary-high':
      return { salaryMax: -1, salaryMin: -1 };
    case 'deadline':
      return { applicationDeadline: 1 };
    case 'popular':
      return { views: -1, postedDate: -1 };
    case 'latest':
    default:
      return { postedDate: -1, createdAt: -1 };
  }
}

async function queryJobs(req, res, forcedSector) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const filter = buildJobFilter(req.query, forcedSector);
  const sort = buildSort(req.query.sort);

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  const data = jobs.map((job) => job.publicJSON());

  res.json({
    success: true,
    jobs: data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    filters: req.query,
  });
}

const listJobs = asyncHandler((req, res) => queryJobs(req, res));
const searchJobs = asyncHandler((req, res) => queryJobs(req, res));
const getPrivateJobs = asyncHandler((req, res) => queryJobs(req, res, 'private'));
const getGovernmentJobs = asyncHandler((req, res) => queryJobs(req, res, 'government'));

const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

  const isOwner = req.user && job.employer.toString() === req.user._id.toString();
  const isAdmin = req.user && req.user.role === 'admin';
  const publiclyVisible = job.status === 'approved' && job.isActive;

  if (!publiclyVisible && !isOwner && !isAdmin) {
    return res.status(404).json({ success: false, message: 'Job not found or no longer available.' });
  }

  Job.updateOne({ _id: job._id }, { $inc: { views: 1 } }).catch(() => {});

  const data = job.publicJSON();
  data.applicationCount = await Application.countDocuments({ job: job._id });

  if (job.sector === 'private') {
    const profile = await EmployerProfile.findOne({ user: job.employer }).select(
      'companyName logo website description city state isVerified industry companySize'
    );
    if (profile) data.company = profile.toObject();
  }

  if (req.user && req.user.role === 'jobseeker') {
    const [existing, saved] = await Promise.all([
      Application.findOne({ job: job._id, jobSeeker: req.user._id }).select('_id status'),
      SavedJob.findOne({ job: job._id, user: req.user._id }).select('_id'),
    ]);
    data.hasApplied = Boolean(existing);
    data.applicationStatus = existing ? existing.status : null;
    data.isSaved = Boolean(saved);
  }

  return res.json({ success: true, job: data });
});

async function applyUploadedJobFiles(job, files) {
  if (files && files.logo && files.logo[0]) {
    job.companyLogo = `/uploads/logos/${files.logo[0].filename}`;
  }
  if (files && files.notificationPdf && files.notificationPdf[0]) {
    job.government = job.government || {};
    job.government.notificationPdf = `/uploads/notifications/${files.notificationPdf[0].filename}`;
  }
}

const createJob = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && req.user.role !== 'employer') {
    return res.status(403).json({ success: false, message: 'Only employers can post jobs.' });
  }

  const sector = isAdmin ? (req.body.sector === 'government' ? 'government' : 'private') : 'private';
  const {
    title,
    category,
    description,
    qualification,
    ageLimit,
    experience,
    jobType,
    workMode,
    vacancies,
    applicationDeadline,
    postedDate,
    salaryPeriod,
    salaryText,
    responsibilities,
    skills,
    state,
    district,
    city,
    pincode,
  } = req.body;

  if (!title || !category || !description || !applicationDeadline) {
    cleanupFile(req.files && req.files.logo && req.files.logo[0]);
    cleanupFile(req.files && req.files.notificationPdf && req.files.notificationPdf[0]);
    return res.status(422).json({
      success: false,
      message: 'Job title, category, description and application deadline are required.',
    });
  }

  const deadline = new Date(applicationDeadline);
  if (Number.isNaN(deadline.getTime())) {
    return res.status(422).json({ success: false, message: 'Application deadline is not a valid date.' });
  }
  if (deadline.getTime() <= Date.now()) {
    return res.status(422).json({ success: false, message: 'Application deadline must be in the future.' });
  }

  if (state && !STATES.includes(state)) {
    return res.status(422).json({ success: false, message: 'Please select a valid Indian state or union territory.' });
  }

  let employerProfile = null;
  if (!isAdmin) {
    employerProfile = await EmployerProfile.findOne({ user: req.user._id });
    if (!employerProfile) {
      return res.status(400).json({ success: false, message: 'Please complete your company profile before posting a job.' });
    }
  }

  const job = new Job({
    employer: req.user._id,
    sector,
    title: String(title).trim(),
    category: String(category).trim(),
    description: String(description).trim(),
    responsibilities: parseArray(responsibilities) || [],
    skills: parseArray(skills) || [],
    qualification: qualification || '',
    ageLimit: ageLimit || '',
    experience: experience || '',
    experienceMin: parseNumber(req.body.experienceMin) || 0,
    salaryMin: parseNumber(req.body.salaryMin),
    salaryMax: parseNumber(req.body.salaryMax),
    salaryPeriod: salaryPeriod === 'year' ? 'year' : 'month',
    salaryText: salaryText || '',
    jobType: JOB_TYPES.includes(jobType) ? jobType : 'Full Time',
    workMode: WORK_MODES.includes(workMode) ? workMode : 'On-site',
    location: {
      state: state || '',
      district: district || '',
      city: city || '',
      pincode: pincode || '',
    },
    vacancies: Math.max(1, parseNumber(vacancies) || 1),
    postedDate: postedDate ? new Date(postedDate) : new Date(),
    applicationDeadline: deadline,
    status: isAdmin ? 'approved' : 'pending',
    isActive: true,
    companyName: isAdmin ? req.body.companyName || '' : employerProfile.companyName,
    companyLogo: isAdmin ? req.body.companyLogo || '' : employerProfile.logo || '',
  });

  if (isAdmin) {
    job.approvedBy = req.user._id;
    job.approvedAt = new Date();
  }

  if (sector === 'government') {
    const g = parseObject(req.body.government);
    const organization = g.organization || req.body.organization || req.body.companyName || '';
    const officialWebsite = g.officialWebsite || req.body.officialWebsite || '';

    if (!organization) {
      cleanupFile(req.files && req.files.notificationPdf && req.files.notificationPdf[0]);
      return res.status(422).json({ success: false, message: 'Recruiting organization is required for government jobs.' });
    }
    if (!officialWebsite || !isHttpUrl(officialWebsite)) {
      cleanupFile(req.files && req.files.notificationPdf && req.files.notificationPdf[0]);
      return res.status(422).json({
        success: false,
        message: 'A valid official application website URL (https://...) is required for government jobs.',
      });
    }

    job.companyName = organization;
    if (!job.ageLimit) job.ageLimit = g.ageLimit || req.body.ageLimit || '';
    job.government = {
      organization,
      department: g.department || req.body.department || '',
      notificationNumber: g.notificationNumber || req.body.notificationNumber || '',
      postName: g.postName || req.body.postName || '',
      ageLimit: g.ageLimit || req.body.ageLimit || '',
      eligibility: g.eligibility || req.body.eligibility || '',
      payScale: g.payScale || req.body.payScale || '',
      applicationStartDate: g.applicationStartDate ? new Date(g.applicationStartDate) : null,
      examDate: g.examDate ? new Date(g.examDate) : null,
      selectionProcess: g.selectionProcess || req.body.selectionProcess || '',
      applicationFee: g.applicationFee || req.body.applicationFee || '',
      officialWebsite,
      notificationPdf: '',
      isVerified: false,
    };
  }

  await applyUploadedJobFiles(job, req.files);
  await job.save();

  if (!isAdmin) {
    await createNotification({
      user: req.user._id,
      type: 'system',
      title: 'Job submitted for review',
      message: `Your job "${job.title}" has been submitted and is awaiting admin approval before it is listed publicly.`,
      link: '/employer/jobs',
    });
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    if (admins.length) {
      await createManyNotifications(
        admins.map((admin) => ({
          user: admin._id,
          type: 'system',
          title: 'New job awaiting approval',
          message: `${job.companyName} submitted "${job.title}" for review.`,
          link: '/admin/pending-approvals',
        }))
      );
    }
  }

  return res.status(201).json({
    success: true,
    message: isAdmin ? 'Job published successfully.' : 'Job submitted for admin approval.',
    job: job.publicJSON(),
  });
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    cleanupFile(req.files && req.files.logo && req.files.logo[0]);
    cleanupFile(req.files && req.files.notificationPdf && req.files.notificationPdf[0]);
    return res.status(404).json({ success: false, message: 'Job not found.' });
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = job.employer.toString() === req.user._id.toString();
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ success: false, message: 'You can only edit your own jobs.' });
  }

  const fields = [
    'title',
    'category',
    'description',
    'qualification',
    'ageLimit',
    'experience',
    'salaryText',
    'jobType',
    'workMode',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) job[field] = req.body[field];
  });

  if (req.body.responsibilities !== undefined) job.responsibilities = parseArray(req.body.responsibilities) || [];
  if (req.body.skills !== undefined) job.skills = parseArray(req.body.skills) || [];
  if (req.body.experienceMin !== undefined) job.experienceMin = parseNumber(req.body.experienceMin) || 0;
  if (req.body.salaryMin !== undefined) job.salaryMin = parseNumber(req.body.salaryMin);
  if (req.body.salaryMax !== undefined) job.salaryMax = parseNumber(req.body.salaryMax);
  if (req.body.salaryPeriod !== undefined) job.salaryPeriod = req.body.salaryPeriod === 'year' ? 'year' : 'month';
  if (req.body.vacancies !== undefined) job.vacancies = Math.max(1, parseNumber(req.body.vacancies) || 1);

  if (req.body.applicationDeadline !== undefined) {
    const deadline = new Date(req.body.applicationDeadline);
    if (Number.isNaN(deadline.getTime())) {
      return res.status(422).json({ success: false, message: 'Application deadline is not a valid date.' });
    }
    job.applicationDeadline = deadline;
  }

  const loc = job.location || {};
  ['state', 'district', 'city', 'pincode'].forEach((key) => {
    if (req.body[key] !== undefined) loc[key] = req.body[key];
  });
  if (loc.state && !STATES.includes(loc.state)) {
    return res.status(422).json({ success: false, message: 'Please select a valid Indian state or union territory.' });
  }
  job.location = loc;

  if (isAdmin && req.body.companyName) job.companyName = req.body.companyName;

  if (job.sector === 'government') {
    const g = parseObject(req.body.government);
    const gov = job.government || {};
    ['organization', 'department', 'notificationNumber', 'postName', 'ageLimit', 'eligibility', 'payScale', 'selectionProcess', 'applicationFee'].forEach(
      (key) => {
        if (g[key] !== undefined) gov[key] = g[key];
        else if (req.body[key] !== undefined) gov[key] = req.body[key];
      }
    );
    if (g.officialWebsite !== undefined || req.body.officialWebsite !== undefined) {
      const website = g.officialWebsite || req.body.officialWebsite;
      if (website && !isHttpUrl(website)) {
        return res.status(422).json({ success: false, message: 'Official website must be a valid http(s) URL.' });
      }
      gov.officialWebsite = website || '';
    }
    if (g.applicationStartDate !== undefined) gov.applicationStartDate = g.applicationStartDate ? new Date(g.applicationStartDate) : null;
    if (g.examDate !== undefined) gov.examDate = g.examDate ? new Date(g.examDate) : null;
    job.government = gov;
    if (!job.ageLimit) job.ageLimit = gov.ageLimit || '';
    if (gov.organization) job.companyName = gov.organization;
  }

  if (!isAdmin) {
    job.status = 'pending';
    job.approvedAt = null;
    job.approvedBy = null;
    job.rejectionReason = '';
  }

  await applyUploadedJobFiles(job, req.files);
  await job.save();

  return res.json({
    success: true,
    message: isAdmin ? 'Job updated successfully.' : 'Job updated and resubmitted for approval.',
    job: job.publicJSON(),
  });
});

const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

  const isAdmin = req.user.role === 'admin';
  const isOwner = job.employer.toString() === req.user._id.toString();
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ success: false, message: 'You can only delete your own jobs.' });
  }

  await Promise.all([
    Application.deleteMany({ job: job._id }),
    SavedJob.deleteMany({ job: job._id }),
  ]);
  await job.deleteOne();

  return res.json({ success: true, message: 'Job deleted successfully.' });
});

const toggleJobStatus = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

  const isAdmin = req.user.role === 'admin';
  const isOwner = job.employer.toString() === req.user._id.toString();
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ success: false, message: 'You can only manage your own jobs.' });
  }
  if (req.body.isActive === undefined) {
    return res.status(422).json({ success: false, message: 'isActive is required.' });
  }

  job.isActive = Boolean(req.body.isActive);
  await job.save();

  return res.json({
    success: true,
    message: job.isActive ? 'Job activated successfully.' : 'Job deactivated successfully.',
    job: job.publicJSON(),
  });
});

const getJobMeta = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    meta: {
      privateCategories: PRIVATE_CATEGORIES,
      governmentCategories: GOVERNMENT_CATEGORIES,
      qualifications: QUALIFICATIONS,
      experienceLevels: EXPERIENCE_LEVELS,
      jobTypes: JOB_TYPES,
      workModes: WORK_MODES,
      states: STATES,
    },
  });
});

module.exports = {
  listJobs,
  searchJobs,
  getPrivateJobs,
  getGovernmentJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  toggleJobStatus,
  getJobMeta,
  parseArray,
};
