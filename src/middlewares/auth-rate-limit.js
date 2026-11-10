import { rateLimit } from "express-rate-limit";

function createAuthRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, res) {
      res.status(429).render("pages/rate-limit", {
        title: "Too many attempts",
        message: "Too many attempts. Please wait 15 minutes before trying again.",
      });
    },
  });
}

export const loginRateLimit = createAuthRateLimit();
export const registrationRateLimit = createAuthRateLimit();
