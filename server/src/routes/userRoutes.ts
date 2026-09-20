import { Router } from "express";
import prisma from "../utils/prisma.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
  authenticate,
  type AuthenticatedRequest,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Get users
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "PROJECT_MANAGER"),
  async (_req, res) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: {
            in: ["PROJECT_MANAGER", "DEVELOPER"],
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.error("Get users error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  }
);

// Get current logged-in user
router.get(
  "/me",
  authenticate,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id: req.user!.userId,
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(
        "Get user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Internal server error",
      });
    }
  }
);

export default router;