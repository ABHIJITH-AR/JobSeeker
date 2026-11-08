const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { uploadJobFiles } = require('../middleware/upload');
const {
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
} = require('../controllers/jobController');

const router = express.Router();

router.get('/meta', getJobMeta);
router.get('/search', searchJobs);
router.get('/private', getPrivateJobs);
router.get('/government', getGovernmentJobs);
router.get('/', listJobs);

router.post(
  '/',
  protect,
  authorize('employer', 'admin'),
  uploadJobFiles,
  [
    body('title').trim().notEmpty().withMessage('Job title is required.'),
    body('category').trim().notEmpty().withMessage('Category is required.'),
    body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters.'),
    body('applicationDeadline').notEmpty().withMessage('Application deadline is required.'),
  ],
  validate,
  createJob
);

router.get('/:id', optionalAuth, getJobById);
router.put('/:id', protect, authorize('employer', 'admin'), uploadJobFiles, updateJob);
router.delete('/:id', protect, authorize('employer', 'admin'), deleteJob);
router.patch('/:id/status', protect, authorize('employer', 'admin'), toggleJobStatus);

module.exports = router;
