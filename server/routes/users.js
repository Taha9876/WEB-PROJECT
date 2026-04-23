const express = require('express');
const router = express.Router();

// GET /api/users/profile/:id
router.get('/profile/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'John Doe',
    email: 'john@healthtrack.com',
    role: 'user',
    age: 28,
    weight: 73.8,
    height: 175,
    goalWeight: 70,
    createdAt: '2025-01-15',
  });
});

// PUT /api/users/profile/:id
router.put('/profile/:id', (req, res) => {
  res.json({ message: 'Profile updated successfully', data: req.body });
});

// GET /api/users - List all users (admin)
router.get('/', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@email.com', role: 'user', status: 'Active' },
    { id: 2, name: 'Dr. Sarah Khan', email: 'sarah@email.com', role: 'doctor', status: 'Active' },
    { id: 3, name: 'Ayesha Malik', email: 'ayesha@email.com', role: 'user', status: 'Active' },
  ]);
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  res.json({ message: `User ${req.params.id} deleted` });
});

module.exports = router;
