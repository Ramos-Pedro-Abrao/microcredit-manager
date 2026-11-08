export function errorHandler(error, _req, res, next) {
  console.error("Request failed:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.statusCode ?? 500).render("pages/error", {
    title: "Something went wrong",
    message: process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again later."
      : error.message,
  });
}
