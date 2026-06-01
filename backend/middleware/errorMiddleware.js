// Error handling middleware to format all operational and technical exceptions in JSON format.
export const errorHandler = (err, req, res, next) => {
  console.error("Express Error Handler Captured Exception:", err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

// Route not found fallback middleware.
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
