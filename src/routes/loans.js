import { Router } from "express";
import { index } from "../controllers/loans.js";
import { requireAuth } from "../middlewares/auth-guard.js";

const router = Router();

router.get("/", requireAuth, index);

export default router;
