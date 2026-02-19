/**
 * AXO NETWORKS — AUTHORIZATION MIDDLEWARE
 * Enterprise RBAC (Permission Based)
 */

const { ROLE_PERMISSIONS } = require("../config/roles.config");
const AppError = require("../utils/AppError");

const authorize = (requiredPermissions = []) => {
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

    // Case-insensitive role handling
    const roleKey = user.role.toLowerCase();
    const rolePermissions = ROLE_PERMISSIONS[roleKey];

    if (!rolePermissions) {
      return next(
        new AppError("Access denied. Invalid role.", 403, {
          errorCode: "AUTH_INVALID_ROLE",
        })
      );
    }

    // SUPER ADMIN wildcard access
    if (rolePermissions.includes("*")) {
      return next();
    }

    const hasPermission = permissions.some((permission) =>
      rolePermissions.includes(permission)
    );

    if (!hasPermission) {
      return next(
        new AppError("Forbidden. Insufficient permissions.", 403, {
          errorCode: "AUTH_PERMISSION_DENIED",
          meta: {
            requiredPermissions: permissions,
            userRole: roleKey,
          },
        })
      );
    }

    next();
  };
};

module.exports = authorize;

