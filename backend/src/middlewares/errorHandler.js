export function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  const status = err.status || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Something went wrong";

  res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details: err.details || null
    }
  });
}
