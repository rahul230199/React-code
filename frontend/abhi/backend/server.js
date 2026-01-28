const express = require('express');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const swaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./swagger');




const app = express();
const PORT = process.env.PORT || 3001;

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC FILES ================= */
// Serve frontend assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../frontend')));

/* ================= API ROUTES ================= */
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

/* ================= PAGE ROUTES ================= */

// Root → login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Dashboard page
// 🔐 Frontend JS handles token check
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

/* ================= SERVER ================= */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
