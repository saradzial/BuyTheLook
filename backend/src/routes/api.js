const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommendController');
const validateProfile = require('../middleware/validateProfile');

router.post('/recommend', validateProfile, recommendController.getRecommendations);

module.exports = router;