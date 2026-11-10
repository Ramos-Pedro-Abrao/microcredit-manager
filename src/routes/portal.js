import { Router } from "express";
import {
  cancelRequest,
  createRequest,
  index,
  newRequest,
  profile,
  updateProfile,
} from "../controllers/portal.js";
import { requireAuth, requireRole } from "../middlewares/auth-guard.js";

const router = Router();

router.use(requireAuth, requireRole("CLIENT"));
router.get("/", index);
router.get("/profile", profile);
router.post("/profile", updateProfile);
router.get("/requests/new", newRequest);
router.post("/requests", createRequest);
router.post("/requests/:id/cancel", cancelRequest);

export default router;
