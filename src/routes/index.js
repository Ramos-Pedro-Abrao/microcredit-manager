import { Router } from "express";
import { dashboard, health, home } from "../controllers/index.js";
import authRoutes from "./auth.js";
import clientRoutes from "./clients.js";
import loanRoutes from "./loans.js";
import paymentRoutes from "./payments.js";
import userRoutes from "./users.js";
import { requireAuth } from "../middlewares/auth-guard.js";

const router = Router();

router.get("/health", health);
router.get("/", home);
router.get("/dashboard", requireAuth, dashboard);
router.use("/", authRoutes);
router.use("/clients", clientRoutes);
router.use("/loans", loanRoutes);
router.use("/payments", paymentRoutes);
router.use("/users", userRoutes);

export default router;
