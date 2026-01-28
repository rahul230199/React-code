// backend/routes/auth.routes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success
 *       401:
 *         description: Invalid credentials
 */

/* ========= LOGIN ========= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'MISSING_FIELDS' });

  try {
    const { rows } = await db.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (!rows.length)
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const user = rows[0];

    // ⚠️ DEV ONLY
    if (password !== user.password_hash)
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

/* ========= ME ========= */
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, email FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!rows.length)
      return res.status(404).json({ error: 'USER_NOT_FOUND' });

    res.json(rows[0]);
  } catch (err) {
    console.error('ME ERROR:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

module.exports = router;
