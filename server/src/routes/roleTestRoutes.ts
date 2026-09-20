import { Router } from "express";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/admin-only",
  authenticate,
  authorize("ADMIN"),
  (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      message: "You are an admin",
      user: req.user,
    });
  }
);

router.get(
  "/manager-only",
  authenticate,
  authorize("PROJECT_MANAGER"),
  (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      message: "You are a project manager",
      user: req.user,
    });
  }
);

router.get(
  "/developer-only",
  authenticate,
  authorize("DEVELOPER"),
  (req: AuthenticatedRequest, res) => {
    res.json({
      success: true,
      message: "You are a developer",
      user: req.user,
    });
  }
);

export default router;