const recommendationService = require('../services/recommendationService');

exports.getRecommendations = async (req, res) => {
    try {
        const userProfile = req.body;
        if (!userProfile || typeof userProfile !== 'object') {
            return res.status(400).json({ error: 'Invalid user profile' });
        }
        const recommendations = await recommendationService.generateRecommendations(userProfile);
        res.json({ recommendations });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};