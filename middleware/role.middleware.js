/**
 * Role-based access control middleware
 *
 * Usage:
 * authorizeRoles("BUYER")
 * authorizeRoles("SUPPLIER")
 * authorizeRoles("BUYER", "ADMIN")
 */

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // This assumes auth middleware already attached req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
