const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, logout, me } = require('../controllers/authController');

const router = express.Router();

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long.')
  .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
  .withMessage('Password must contain at least one letter and one number.');

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be between 2 and 80 characters.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('phone').trim().matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10 digit Indian mobile number.'),
    passwordRule,
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Password and confirm password do not match.'),
    body('role').isIn(['jobseeker', 'employer']).withMessage('Account type must be Job Seeker or Employer.'),
    body('companyName')
      .if(body('role').equals('employer'))
      .trim()
      .notEmpty()
      .withMessage('Company name is required for employer accounts.'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

router.post('/logout', protect, logout);
router.get('/me', protect, me);

module.exports = router;
