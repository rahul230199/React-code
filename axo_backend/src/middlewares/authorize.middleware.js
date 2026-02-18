/* =========================================================
   AXO NETWORKS — AUTHORIZATION MIDDLEWARE (ENTERPRISE)
   Permission-Based RBAC Enforcement
========================================================= */

const { ROLE_PERMISSIONS } = require("../config/roles.config");
const AppError = require("../utils/AppError");

/* =========================================================
   AUTHORIZE PERMISSION
   Supports single or multiple permissions
========================================================= */

const authorize = (requiredPermissions = []) => {
  // Normalize to array
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.role) {
      return next(
        new AppError("Access denied. Role missing.", 403, {
          errorCode: "AUTH_ROLE_MISSING",
        })
      );
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role];

    if (!rolePermissions) {
      return next(
        new AppError("Access denied. Invalid role.", 403, {
          errorCode: "AUTH_INVALID_ROLE",
        })
      );
    }

    // SUPER ADMIN wildcard
    if (rolePermissions.includes("*")) {
      return next();
    }

    // Check if at least one required permission is allowed
    const hasPermission = permissions.some((permission) =>
      rolePermissions.includes(permission)
    );

    if (!hasPermission) {
      return next(
        new AppError("Forbidden. Insufficient permissions.", 403, {
          errorCode: "AUTH_PERMISSION_DENIED",
          meta: {
            requiredPermissions: permissions,
            userRole: user.role,
          },
        })
      );
    }

    next();
  };
};

module.exports = authorize;
