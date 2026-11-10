import { Router } from "express";
import {
  loginRateLimit,
  registrationRateLimit,
} from "../middlewares/auth-rate-limit.js";
import { login, logout, showLogin } from "../controllers/auth.js";
import { register, showRegistration } from "../controllers/registration.js";
import { requireAuth } from "../middlewares/auth-guard.js";

const router = Router();

router.get("/login", showLogin);
router.post("/login", loginRateLimit, login);
router.get("/register", showRegistration);
router.post("/register", registrationRateLimit, register);
router.post("/logout", requireAuth, logout);

export default router;
