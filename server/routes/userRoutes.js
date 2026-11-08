const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { uploadResume, uploadPhoto } = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  uploadResume: uploadResumeHandler,
  downloadResume,
  deleteResume,
  uploadProfilePhoto,
  changePassword,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', authorize('jobseeker'), updateProfile);
router.post('/resume', authorize('jobseeker'), uploadResume, uploadResumeHandler);
router.get('/resume/download', authorize('jobseeker'), downloadResume);
router.delete('/resume', authorize('jobseeker'), deleteResume);
router.post('/photo', authorize('jobseeker'), uploadPhoto, uploadProfilePhoto);

router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long.')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage('New password must contain at least one letter and one number.'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('New password and confirm password do not match.'),
  ],
  validate,
  changePassword
);

module.exports = router;
