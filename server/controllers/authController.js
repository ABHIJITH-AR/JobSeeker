const User = require('../models/User');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');
const asyncHandler = require('../middleware/asyncHandler');
const { generateToken } = require('../utils/generateToken');
const { createNotification } = require('./notificationController');

async function buildProfile(user) {
  if (user.role === 'jobseeker') {
    const profile = await JobSeekerProfile.findOne({ user: user._id });
    return {
      ...user.toSafeJSON(),
      profile: profile
        ? {
            ...profile.toObject(),
            completion: profile.completion(),
            hasResume: Boolean(profile.resume && profile.resume.filename),
          }
        : null,
    };
  }
  if (user.role === 'employer') {
    const profile = await EmployerProfile.findOne({ user: user._id });
    return { ...user.toSafeJSON(), profile: profile ? profile.toObject() : null };
  }
  return { ...user.toSafeJSON(), profile: null };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, companyName, companyEmail, contactNumber, website, city, district, state } = req.body;

  if (!['jobseeker', 'employer'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Account type must be Job Seeker or Employer.' });
  }

  const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  if (role === 'employer' && (!companyName || !String(companyName).trim())) {
    return res.status(422).json({ success: false, message: 'Company name is required for employer accounts.' });
  }

  const user = await User.create({
    name: name.trim(),
    email: String(email).toLowerCase().trim(),
    phone: phone.trim(),
    password,
    role,
  });

  try {
    if (role === 'jobseeker') {
      await JobSeekerProfile.create({
        user: user._id,
        fullName: name.trim(),
        phone: phone.trim(),
        state: state || '',
        district: district || '',
        city: city || '',
      });
    } else {
      await EmployerProfile.create({
        user: user._id,
        companyName: String(companyName).trim(),
        companyEmail: companyEmail || email,
        contactNumber: contactNumber || phone,
        website: website || '',
        city: city || '',
        district: district || '',
        state: state || '',
      });
    }
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  await createNotification({
    user: user._id,
    type: 'system',
    title: 'Welcome to JobSeeker',
    message:
      role === 'employer'
        ? 'Your employer account is ready. Complete your company profile and post your first job. New jobs are reviewed by our team before going live.'
        : 'Your account is ready. Complete your profile and upload a resume to start applying for jobs across India.',
    link: role === 'employer' ? '/employer/profile' : '/dashboard/profile',
  });

  const token = generateToken(user);
  const payload = await buildProfile(user);
  return res.status(201).json({ success: true, message: 'Account created successfully.', token, user: payload });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }
  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);
  const payload = await buildProfile(user);
  return res.json({ success: true, message: 'Logged in successfully.', token, user: payload });
});

const logout = asyncHandler(async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

const me = asyncHandler(async (req, res) => {
  const payload = await buildProfile(req.user);
  return res.json({ success: true, user: payload });
});

module.exports = { register, login, logout, me, buildProfile };
