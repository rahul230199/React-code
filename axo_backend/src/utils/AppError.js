class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    options = {}
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.success = false;

    // Automatically classify operational errors
    this.isOperational = statusCode >= 400 && statusCode < 500;

    // Optional structured additions
    this.errorCode = options.errorCode || null; // e.g. AUTH_001
    this.meta = options.meta || null; // extra debugging info
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: this.success,
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

module.exports = AppError;
