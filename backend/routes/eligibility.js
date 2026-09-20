const express = require('express');
const router = express.Router();
const eligibilityController = require('../controllers/eligibilityController');
const { validateEligibilityPayload } = require('../middleware/validator');

router.post('/check', validateEligibilityPayload, eligibilityController.checkEligibility);

module.exports = router;
