const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { listSavedJobs, saveJob, removeSavedJob, checkSavedJob } = require('../controllers/savedJobController');

const router = express.Router();

router.use(protect, authorize('jobseeker'));

router.get('/', listSavedJobs);
router.get('/check/:jobId', checkSavedJob);
router.post('/:jobId', saveJob);
router.delete('/:jobId', removeSavedJob);

module.exports = router;
