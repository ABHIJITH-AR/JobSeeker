const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  applyToJob,
  myApplications,
  getApplication,
  updateStatus,
  downloadApplicationResume,
  employerApplicants,
  jobApplicants,
  adminApplications,
} = require('../controllers/applicationController');

const router = express.Router();

router.use(protect);

router.post('/', authorize('jobseeker'), applyToJob);
router.get('/my-applications', authorize('jobseeker'), myApplications);
router.get('/employer', authorize('employer'), employerApplicants);
router.get('/admin', authorize('admin'), adminApplications);
router.get('/job/:jobId', authorize('employer', 'admin'), jobApplicants);

router.get('/:id', getApplication);
router.patch('/:id/status', authorize('employer', 'admin'), updateStatus);
router.get('/:id/resume', downloadApplicationResume);

module.exports = router;
