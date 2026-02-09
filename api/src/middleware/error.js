function errorHandler(err, req, res, next) {
  if (err && err.name === "ZodError") {
    return res.status(400).json({ error: "Invalid input", details: err.errors });
  }
  console.error(err);
  return res.status(500).json({ error: "Server error" });
}

module.exports = { errorHandler };
