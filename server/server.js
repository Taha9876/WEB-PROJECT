const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/health', require('./routes/health'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', message: 'HealthTrack API is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
