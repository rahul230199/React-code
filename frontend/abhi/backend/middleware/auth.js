const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 *
 * Header required:
 * Authorization: Bearer <JWT_TOKEN>
 *
 * On success:
 *   req.user = { id, email, role?, iat, exp }
 *
 * Errors:
 *   401 NO_TOKEN
 *   401 INVALID_TOKEN
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // ❌ Missing header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'NO_TOKEN' });
    }

    const token = authHeader.split(' ')[1];

    // ❌ Empty token
    if (!token) {
      return res.status(401).json({ error: 'NO_TOKEN' });
    }

    // ✅ Use single secret everywhere
    const secret = process.env.JWT_SECRET || 'dev_secret';

    // ✅ Verify token
    const decoded = jwt.verify(token, secret);

    // ✅ Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || null,
    };

    next();
  } catch (err) {
    console.error('❌ JWT AUTH ERROR:', err.message);
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
}

module.exports = authMiddleware;
