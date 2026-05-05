/**
 * Custom application error class for operational errors.
 * Extends the native Error with an HTTP status code and operational flag.
 *
 * Usage:
 *   throw new AppError('Post not found', 404);
 *   throw new AppError('Invalid credentials', 401);
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Preserve correct stack trace in V8 engines
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
