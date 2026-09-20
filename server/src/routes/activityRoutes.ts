import { Router } from "express";
import { getRecentActivity } from "../controllers/activity.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
  getRecentActivity
);

export default router;