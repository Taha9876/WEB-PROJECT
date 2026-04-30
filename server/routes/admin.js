const express = require('express');
const router = express.Router();

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  res.json({
    totalUsers: 580,
    activeUsers: 423,
    totalDoctors: 12,
    consultationsToday: 18,
    userGrowth: '+38%',
  });
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@email.com', role: 'user', status: 'Active', joined: '2025-01-15' },
    { id: 2, name: 'Dr. Sarah Khan', email: 'sarah@email.com', role: 'doctor', status: 'Active', joined: '2025-01-10' },
    { id: 3, name: 'Ayesha Malik', email: 'ayesha@email.com', role: 'user', status: 'Active', joined: '2025-02-05' },
  ]);
});

// POST /api/admin/users
router.post('/users', (req, res) => {
  res.json({ message: 'User created successfully', data: req.body });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} deleted` });
});

module.exports = router;
