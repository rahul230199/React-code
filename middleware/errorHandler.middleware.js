/**
 * Global error handling middleware
 * Must be registered AFTER all routes
 */
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // PostgreSQL errors
  if (err.code) {
    statusCode = 400;
    message = "Database error";
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON payload";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
