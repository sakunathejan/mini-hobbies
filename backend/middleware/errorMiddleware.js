export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (err.name === "ValidationError") {
    return res.status(422).json({
      message: "Validation failed.",
      errors: Object.values(err.errors || {}).map((e) => e.message)
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource identifier." });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ message: `Duplicate value for ${field}.` });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body." });
  }

  res.status(statusCode).json({
    message: err.message || "Internal server error."
  });
};
