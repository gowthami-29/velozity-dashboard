import { Router } from "express";

import {
  createTask,
  updateTaskStatus,
  getTasks,
} from "../controllers/task.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

import {
  createTaskSchema,
  updateTaskStatusSchema,
} from "../utils/validation.js";

import { validate } from "../middlewares/validation.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER"),
  validate(createTaskSchema),
  createTask
);

router.patch(
  "/:taskId/status",
  authenticate,
  authorize(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  validate(updateTaskStatusSchema),
  updateTaskStatus
);

router.get(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getTasks
);

export default router;