import { Router } from "express";
import { health, home } from "../controllers/index.js";
import authRoutes from "./auth.js";
import clientRoutes from "./clients.js";
import loanRoutes from "./loans.js";
import paymentRoutes from "./payments.js";

const router = Router();

router.get("/health", health);
router.get("/", home);
router.use("/", authRoutes);
router.use("/clients", clientRoutes);
router.use("/loans", loanRoutes);
router.use("/payments", paymentRoutes);

export default router;
