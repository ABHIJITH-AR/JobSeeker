const fs = require('fs');
const path = require('path');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { fileMeta, cleanupFile, MAX_RESUME_MB, MAX_LOGO_MB, RESUME_DIR } = require('../middleware/upload');
const { STATES } = require('../data/indiaLocations');

function safeResumePath(relativePath) {
  const absolute = path.resolve(path.join(__dirname, '..', relativePath));
  const root = path.resolve(RESUME_DIR);
  if (!absolute.startsWith(root + path.sep) && absolute !== root) return null;
  return absolute;
}

const getProfile = asyncHandler(async (req, res) => {
  if (req.user.role === 'jobseeker') {
    const profile = await JobSeekerProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
    return res.json({
      success: true,
      user: req.user.toSafeJSON(),
      profile: { ...profile.toObject(), completion: profile.completion() },
    });
  }
  return res.json({ success: true, user: req.user.toSafeJSON(), profile: null });
});

const updateProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'jobseeker') {
    return res.status(403).json({ success: false, message: 'Only job seekers have a job seeker profile.' });
  }

  const profile = await JobSeekerProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });

  const allowed = [
    'fullName',
    'profilePhoto',
    'phone',
    'address',
    'state',
    'district',
    'city',
    'education',
    'collegeName',
    'experience',
    'careerObjective',
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });

  if (req.body.dateOfBirth !== undefined) {
    profile.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
  }
  if (req.body.graduationYear !== undefined) {
    profile.graduationYear = req.body.graduationYear ? Number(req.body.graduationYear) : null;
  }
  if (req.body.skills !== undefined) {
    if (Array.isArray(req.body.skills)) profile.skills = req.body.skills.map((s) => String(s).trim()).filter(Boolean);
    else profile.skills = String(req.body.skills).split(',').map((s) => s.trim()).filter(Boolean);
  }

  if (profile.state && !STATES.includes(profile.state)) {
    return res.status(422).json({ success: false, message: 'Please select a valid Indian state or union territory.' });
  }
  if (profile.phone && !/^[6-9]\d{9}$/.test(profile.phone)) {
    return res.status(422).json({ success: false, message: 'Please provide a valid 10 digit mobile number.' });
  }

  await profile.save();

  const userUpdates = {};
  if (req.body.fullName) userUpdates.name = req.body.fullName;
  if (req.body.phone) userUpdates.phone = req.body.phone;
  if (Object.keys(userUpdates).length) {
    await User.updateOne({ _id: req.user._id }, userUpdates, { runValidators: true });
  }

  return res.json({
    success: true,
    message: 'Profile updated successfully.',
    profile: { ...profile.toObject(), completion: profile.completion() },
  });
});

const uploadResume = asyncHandler(async (req, res) => {
  if (req.user.role !== 'jobseeker') {
    cleanupFile(req.file);
    return res.status(403).json({ success: false, message: 'Only job seekers can upload a resume.' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select a PDF, DOC or DOCX file to upload.' });
  }
  if (req.file.size > MAX_RESUME_MB * 1024 * 1024) {
    cleanupFile(req.file);
    return res.status(400).json({ success: false, message: `Resume must be smaller than ${MAX_RESUME_MB}MB.` });
  }

  const profile = await JobSeekerProfile.findOne({ user: req.user._id });
  if (!profile) {
    cleanupFile(req.file);
    return res.status(404).json({ success: false, message: 'Profile not found.' });
  }

  if (profile.resume && profile.resume.path) {
    const oldPath = safeResumePath(profile.resume.path);
    if (oldPath && fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (err) {
        // ignore
      }
    }
  }

  profile.resume = fileMeta(req.file);
  await profile.save();

  return res.json({ success: true, message: 'Resume uploaded successfully.', resume: profile.resume });
});

const downloadResume = asyncHandler(async (req, res) => {
  const profile = await JobSeekerProfile.findOne({ user: req.user._id });
  if (!profile || !profile.resume || !profile.resume.path) {
    return res.status(404).json({ success: false, message: 'No resume uploaded yet.' });
  }
  const absolute = safeResumePath(profile.resume.path);
  if (!absolute || !fs.existsSync(absolute)) {
    return res.status(404).json({ success: false, message: 'Resume file could not be found.' });
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.download(absolute, profile.resume.originalName || 'resume.pdf');
});

const deleteResume = asyncHandler(async (req, res) => {
  const profile = await JobSeekerProfile.findOne({ user: req.user._id });
  if (!profile || !profile.resume) {
    return res.status(404).json({ success: false, message: 'No resume to delete.' });
  }
  const absolute = safeResumePath(profile.resume.path);
  if (absolute && fs.existsSync(absolute)) {
    try {
      fs.unlinkSync(absolute);
    } catch (err) {
      // ignore
    }
  }
  profile.resume = null;
  await profile.save();
  return res.json({ success: true, message: 'Resume deleted successfully.' });
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select a JPG, PNG, WEBP or GIF image.' });
  }
  if (req.file.size > MAX_LOGO_MB * 1024 * 1024) {
    cleanupFile(req.file);
    return res.status(400).json({ success: false, message: `Profile photo must be smaller than ${MAX_LOGO_MB}MB.` });
  }

  const profile = await JobSeekerProfile.findOne({ user: req.user._id });
  if (!profile) {
    cleanupFile(req.file);
    return res.status(404).json({ success: false, message: 'Profile not found.' });
  }

  if (profile.profilePhoto && profile.profilePhoto.startsWith('/uploads/profiles/')) {
    const oldPath = path.join(__dirname, '..', profile.profilePhoto.replace(/^\//, ''));
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (err) {
        // ignore
      }
    }
  }

  profile.profilePhoto = `/uploads/profiles/${req.file.filename}`;
  await profile.save();

  return res.json({ success: true, message: 'Profile photo updated successfully.', profilePhoto: profile.profilePhoto });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }
  if (currentPassword === newPassword) {
    return res.status(422).json({ success: false, message: 'New password must be different from the current password.' });
  }
  user.password = newPassword;
  await user.save();
  return res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  downloadResume,
  deleteResume,
  uploadProfilePhoto,
  changePassword,
  safeResumePath,
};
