import type { ErrorRequestHandler } from "express";
import { HttpError } from "../utils/http-error.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error("Unhandled request error:", error);
  res.status(500).json({ error: "Internal server error" });
};
