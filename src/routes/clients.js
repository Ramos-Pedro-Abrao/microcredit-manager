import { Router } from "express";
import {
  create,
  editForm,
  index,
  newClient,
  reject,
  show,
  update,
  verify,
} from "../controllers/clients.js";
import { requireAuth, requireRole } from "../middlewares/auth-guard.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN", "MANAGER", "OPERATOR"));
router.get("/", index);
router.get("/new", newClient);
router.post("/", create);
router.get("/:id/edit", editForm);
router.post("/:id/edit", update);
router.post("/:id/verify", requireRole("ADMIN", "MANAGER"), verify);
router.post("/:id/reject", requireRole("ADMIN", "MANAGER"), reject);
router.get("/:id", show);

export default router;
