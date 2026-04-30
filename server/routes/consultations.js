const express = require('express');
const router = express.Router();

// GET /api/consultations/doctors
router.get('/doctors', (req, res) => {
  res.json([
    { id: 1, name: 'Dr. Sarah Khan', specialty: 'Nutrition & Dietetics', rating: 4.9, available: true },
    { id: 2, name: 'Dr. Ahmed Raza', specialty: 'Sports Medicine', rating: 4.7, available: true },
    { id: 3, name: 'Dr. Fatima Ali', specialty: 'General Wellness', rating: 4.8, available: false },
  ]);
});

// POST /api/consultations/book
router.post('/book', (req, res) => {
  res.json({ message: 'Appointment booked', appointment: { ...req.body, id: Date.now(), status: 'Confirmed' } });
});

// GET /api/consultations/messages/:appointmentId
router.get('/messages/:appointmentId', (req, res) => {
  res.json([
    { id: 1, text: 'Hello! How can I help you today?', sent: false, time: '10:00 AM' },
    { id: 2, text: 'I need advice on my diet plan.', sent: true, time: '10:02 AM' },
  ]);
});

// POST /api/consultations/messages
router.post('/messages', (req, res) => {
  res.json({ message: 'Message sent', data: req.body });
});

// GET /api/consultations/recommendations/:userId
router.get('/recommendations/:userId', (req, res) => {
  res.json([
    { id: 1, doctorName: 'Dr. Sarah Khan', recommendation: 'Increase protein intake to 120g daily', date: '2025-03-28' },
    { id: 2, doctorName: 'Dr. Sarah Khan', recommendation: 'Add more leafy green vegetables', date: '2025-03-25' },
  ]);
});

module.exports = router;
