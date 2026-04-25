/**
 * Wraps async route handlers so errors are passed to Express error middleware
 * instead of causing unhandled promise rejections.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
