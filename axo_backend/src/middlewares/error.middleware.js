/* =========================================================
   AXO NETWORKS — GLOBAL ERROR HANDLER (ENTERPRISE GRADE)
========================================================= */

const AppError = require("../utils/AppError");

/* =========================================================
   GLOBAL ERROR MIDDLEWARE
========================================================= */

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Default values
  if (!error.statusCode) error.statusCode = 500;
  if (!error.message) error.message = "Internal server error";

  const isProduction = process.env.NODE_ENV === "production";

  /* =========================================================
     LOGGING (Structured)
  ========================================================= */

  console.error("❌ ERROR LOG:", {
    path: req.originalUrl,
    method: req.method,
    statusCode: error.statusCode,
    message: error.message,
    errorCode: error.errorCode || null,
    stack: isProduction ? undefined : error.stack,
    timestamp: new Date().toISOString(),
  });

  /* =========================================================
     OPERATIONAL ERROR (Safe to show)
  ========================================================= */

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errorCode: error.errorCode || null,
      ...(isProduction ? {} : { stack: error.stack }),
    });
  }

  /* =========================================================
     PROGRAMMING / UNKNOWN ERROR
     (Hide internal details in production)
  ========================================================= */

  return res.status(500).json({
    success: false,
    message: isProduction
      ? "Something went wrong. Please try again later."
      : error.message,
    ...(isProduction ? {} : { stack: error.stack }),
  });
};

module.exports = errorMiddleware;
