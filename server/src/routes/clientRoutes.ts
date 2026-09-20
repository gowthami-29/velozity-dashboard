import { Router } from "express";
import prisma from "../utils/prisma.js";

import { createClient } from "../controllers/client.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Get clients
router.get(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "PROJECT_MANAGER"
  ),
  async (_req, res) => {
    try {
      const clients =
        await prisma.client.findMany({
          orderBy: {
            createdAt: "desc",
          },
        });

      return res.json({
        success: true,
        count: clients.length,
        clients,
      });
    } catch (error) {
      console.error(
        "Get clients error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch clients",
      });
    }
  }
);

// Create client
router.post(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "PROJECT_MANAGER"
  ),
  createClient
);

export default router;