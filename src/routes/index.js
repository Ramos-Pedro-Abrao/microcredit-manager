import { Router } from "express";
import { dashboard, health, home } from "../controllers/index.js";
import authRoutes from "./auth.js";
import clientRoutes from "./clients.js";
import loanRoutes from "./loans.js";
import paymentRoutes from "./payments.js";
import userRoutes from "./users.js";
import { requireAuth, requireRole } from "../middlewares/auth-guard.js";
import portalRoutes from "./portal.js";
import requestRoutes from "./requests.js";

const router = Router();

router.get("/health", health);
router.get("/", home);
router.get("/dashboard", requireAuth, requireRole("ADMIN", "MANAGER", "OPERATOR"), dashboard);
router.use("/", authRoutes);
router.use("/clients", clientRoutes);
router.use("/loans", requireAuth, requireRole("ADMIN", "MANAGER", "OPERATOR"), loanRoutes);
router.use("/payments", requireAuth, requireRole("ADMIN", "MANAGER", "OPERATOR"), paymentRoutes);
router.use("/users", userRoutes);
router.use("/portal", portalRoutes);
router.use("/requests", requireAuth, requireRole("ADMIN", "MANAGER"), requestRoutes);

export default router;
