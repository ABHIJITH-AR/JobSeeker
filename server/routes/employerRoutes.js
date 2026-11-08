const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');
const { getProfile, updateProfile, getDashboard, getJobs } = require('../controllers/employerController');
const { employerApplicants } = require('../controllers/applicationController');

const router = express.Router();

router.use(protect, authorize('employer'));

router.get('/profile', getProfile);
router.put('/profile', uploadLogo, updateProfile);
router.get('/dashboard', getDashboard);
router.get('/jobs', getJobs);
router.get('/applicants', employerApplicants);

module.exports = router;
