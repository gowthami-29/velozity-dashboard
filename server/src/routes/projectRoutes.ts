import { Router } from "express";

import {
  createProject,
  getProjects,
  getProjectById,
} from "../controllers/project.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER"),
  createProject
);

router.get(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getProjects
);

router.get(
  "/:projectId",
  authenticate,
  authorize(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getProjectById
);

export default router;