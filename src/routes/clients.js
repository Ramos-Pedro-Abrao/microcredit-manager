import { Router } from "express";
import {
  create,
  editForm,
  index,
  newClient,
  show,
  update,
} from "../controllers/clients.js";
import { requireAuth } from "../middlewares/auth-guard.js";

const router = Router();

router.use(requireAuth);
router.get("/", index);
router.get("/new", newClient);
router.post("/", create);
router.get("/:id/edit", editForm);
router.post("/:id/edit", update);
router.get("/:id", show);

export default router;
