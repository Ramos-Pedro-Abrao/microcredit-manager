import { Router } from "express";
import { login, logout, showLogin } from "../controllers/auth.js";
import { requireAuth } from "../middlewares/auth-guard.js";

const router = Router();

router.get("/login", showLogin);
router.post("/login", login);
router.post("/logout", requireAuth, logout);

export default router;
