import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER", "DEVELOPER"),
  getDashboard
);

export default router;