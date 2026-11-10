import { Router } from "express";
import {
  create,
  editForm,
  index,
  newUser,
  resetPassword,
  resetPasswordForm,
  update,
} from "../controllers/users.js";
import { requireAuth, requireRole } from "../middlewares/auth-guard.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));
router.get("/", index);
router.get("/new", newUser);
router.post("/", create);
router.get("/:id/edit", editForm);
router.post("/:id/edit", update);
router.get("/:id/password", resetPasswordForm);
router.post("/:id/password", resetPassword);

export default router;
