const jwt = require("jsonwebtoken");
const pool = require("../src/config/db");

/* ===================== AUTH ===================== */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `SELECT id, email, role, status
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (!result.rows.length || result.rows[0].status !== "active") {
      return res.status(401).json({
        success: false,
        message: "User inactive or not found"
      });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

/* ===================== ROLE GUARDS ===================== */
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Admin access only"
    });
  }
  next();
};

const authorizeBuyer = (req, res, next) => {
  if (req.user.role !== "BUYER") {
    return res.status(403).json({
      success: false,
      message: "Buyer access only"
    });
  }
  next();
};

const authorizeSupplier = (req, res, next) => {
  if (req.user.role !== "SUPPLIER") {
    return res.status(403).json({
      success: false,
      message: "Supplier access only"
    });
  }
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeBuyer,
  authorizeSupplier
};

