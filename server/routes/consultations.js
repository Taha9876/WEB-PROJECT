const express = require('express');
const router = express.Router();

// GET /api/consultations
router.get('/', (req, res) => {
  res.json([
    { id: 1, userId: 1, doctorId: 2, date: '2025-01-20', status: 'completed' },
    { id: 2, userId: 1, doctorId: 2, date: '2025-01-25', status: 'scheduled' },
  ]);
});

// POST /api/consultations
router.post('/', (req, res) => {
  res.json({ message: 'Consultation booked successfully', data: req.body });
});

module.exports = router;
