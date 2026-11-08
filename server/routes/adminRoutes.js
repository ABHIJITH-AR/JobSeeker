const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');
const { adminApplications } = require('../controllers/applicationController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);

router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

router.get('/employers', getEmployers);
router.patch('/employers/:id/verify', verifyEmployer);

router.get('/jobs', getJobs);
router.patch('/jobs/:id/approve', approveJob);
router.patch('/jobs/:id/reject', rejectJob);

router.get('/government-verification', getGovernmentVerification);
router.patch('/government-verification/:id', verifyGovernmentJob);

router.get('/applications', adminApplications);

router.get('/messages', getMessages);
router.patch('/messages/:id', updateMessageStatus);
router.delete('/messages/:id', deleteMessage);

module.exports = router;
