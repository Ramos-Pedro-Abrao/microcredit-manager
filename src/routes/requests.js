import { Router } from "express";
import { index, review, show } from "../controllers/requests.js";

const router = Router();

router.get("/", index);
router.get("/:id", show);
router.post("/:id/review", review);

export default router;
