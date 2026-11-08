const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getCompanies,
  getCompanyById,
  getStats,
  getHomeData,
  submitContact,
} = require('../controllers/publicController');

const router = express.Router();

router.get('/home', getHomeData);
router.get('/stats', getStats);
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyById);

router.post(
  '/contact',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Please enter your full name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.').normalizeEmail(),
    body('subject').trim().isLength({ min: 3, max: 160 }).withMessage('Please enter a subject.'),
    body('message').trim().isLength({ min: 10, max: 3000 }).withMessage('Message must be at least 10 characters.'),
  ],
  validate,
  submitContact
);

module.exports = router;
