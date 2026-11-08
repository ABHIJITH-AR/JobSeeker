const Job = require('../models/Job');
const User = require('../models/User');
const EmployerProfile = require('../models/EmployerProfile');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../middleware/asyncHandler');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = (value) => new RegExp(escapeRegex(value), 'i');

async function companyAggregation(match, page, limit) {
  const pipeline = [
    { $match: match },
    { $lookup: { from: 'jobs', localField: 'user', foreignField: 'employer', as: 'jobs' } },
    {
      $addFields: {
        jobCount: {
          $size: {
            $filter: {
              input: '$jobs',
              as: 'j',
              cond: {
                $and: [
                  { $eq: ['$$j.status', 'approved'] },
                  { $eq: ['$$j.isActive', true] },
                  { $gte: ['$$j.applicationDeadline', new Date()] },
                ],
              },
            },
          },
        },
      },
    },
    { $match: { jobCount: { $gt: 0 } } },
    { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
    { $unwind: '$userDoc' },
    { $match: { 'userDoc.isActive': true } },
    {
      $project: {
        companyName: 1,
        logo: 1,
        description: 1,
        website: 1,
        industry: 1,
        companySize: 1,
        city: 1,
        state: 1,
        isVerified: 1,
        jobCount: 1,
        createdAt: 1,
        'userDoc.name': 1,
        'userDoc.email': 1,
      },
    },
    { $sort: { isVerified: -1, jobCount: -1, companyName: 1 } },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const result = await EmployerProfile.aggregate(pipeline);
  return {
    companies: result[0].data,
    total: result[0].total[0] ? result[0].total[0].count : 0,
  };
}

const getCompanies = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const match = {};
  if (req.query.q) match.companyName = regex(req.query.q);
  if (req.query.state) match.state = regex(req.query.state);
  if (req.query.verified === 'true') match.isVerified = true;

  const { companies, total } = await companyAggregation(match, page, limit);

  res.json({
    success: true,
    companies,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

const getCompanyById = asyncHandler(async (req, res) => {
  const profile = await EmployerProfile.findById(req.params.id).populate('user', 'name email isActive');
  if (!profile || !profile.user || !profile.user.isActive) {
    return res.status(404).json({ success: false, message: 'Company not found.' });
  }

  const jobs = await Job.find({
    employer: profile.user._id,
    status: 'approved',
    isActive: true,
    applicationDeadline: { $gte: new Date() },
  })
    .sort({ postedDate: -1 })
    .limit(50);

  res.json({
    success: true,
    company: profile.toObject(),
    jobs: jobs.map((job) => job.publicJSON()),
  });
});

const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const base = { status: 'approved', isActive: true, applicationDeadline: { $gte: now } };

  const [totalJobs, privateJobs, governmentJobs, companies, jobSeekers, states] = await Promise.all([
    Job.countDocuments(base),
    Job.countDocuments({ ...base, sector: 'private' }),
    Job.countDocuments({ ...base, sector: 'government' }),
    EmployerProfile.countDocuments(),
    User.countDocuments({ role: 'jobseeker', isActive: true }),
    Job.distinct('location.state', base),
  ]);

  res.json({
    success: true,
    stats: {
      totalJobs,
      privateJobs,
      governmentJobs,
      companies,
      jobSeekers,
      statesCovered: states.filter(Boolean).length,
    },
  });
});

const getHomeData = asyncHandler(async (req, res) => {
  const now = new Date();
  const base = { status: 'approved', isActive: true, applicationDeadline: { $gte: now } };

  const [latestPrivate, latestGovernment, companyResult, totalJobs, privateCount, governmentCount, companyCount, seekerCount, categoryAgg, stateAgg] =
    await Promise.all([
      Job.find({ ...base, sector: 'private' }).sort({ postedDate: -1 }).limit(6),
      Job.find({ ...base, sector: 'government' }).sort({ postedDate: -1 }).limit(6),
      companyAggregation({}, 1, 8),
      Job.countDocuments(base),
      Job.countDocuments({ ...base, sector: 'private' }),
      Job.countDocuments({ ...base, sector: 'government' }),
      EmployerProfile.countDocuments(),
      User.countDocuments({ role: 'jobseeker', isActive: true }),
      Job.aggregate([
        { $match: base },
        { $group: { _id: '$category', count: { $sum: 1 }, sector: { $first: '$sector' } } },
        { $sort: { count: -1 } },
        { $limit: 9 },
      ]),
      Job.aggregate([
        { $match: base },
        { $match: { 'location.state': { $nin: ['', null] } } },
        { $group: { _id: '$location.state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);

  res.json({
    success: true,
    latestPrivate: latestPrivate.map((job) => job.publicJSON()),
    latestGovernment: latestGovernment.map((job) => job.publicJSON()),
    featuredCompanies: companyResult.companies,
    stats: {
      totalJobs,
      privateJobs: privateCount,
      governmentJobs: governmentCount,
      companies: companyCount,
      jobSeekers: seekerCount,
    },
    popularCategories: categoryAgg.map((c) => ({ name: c._id, count: c.count, sector: c.sector })),
    popularLocations: stateAgg.map((s) => ({ name: s._id, count: s.count })),
  });
});

const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(422).json({ success: false, message: 'Name, email, subject and message are required.' });
  }
  const contact = await ContactMessage.create({ name, email, phone: phone || '', subject, message });
  return res.status(201).json({
    success: true,
    message: 'Thank you for contacting JobSeeker. Our team will get back to you soon.',
    contactId: contact._id,
  });
});

module.exports = { getCompanies, getCompanyById, getStats, getHomeData, submitContact, companyAggregation };
