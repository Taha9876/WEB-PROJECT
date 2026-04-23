const express = require('express');
const router = express.Router();

// GET /api/health/stats
router.get('/stats', (req, res) => {
  res.json({
    totalUsers: 580,
    activeUsers: 423,
    totalDoctors: 12,
    consultationsToday: 18,
    userGrowth: '+38%',
  });
});

// GET /api/health/trends
router.get('/trends', (req, res) => {
  res.json({
    weightLoss: 15,
    exerciseMinutes: 45,
    waterIntake: 8,
    calorieIntake: 1800,
  });
});

module.exports = router;
