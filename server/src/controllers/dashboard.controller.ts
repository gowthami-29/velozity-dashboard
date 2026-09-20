
import type { Response } from "express";
import prisma from "../utils/prisma.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

export const getDashboard = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const role = req.user.role;

    /*
     * Optional query filters.
     *
     * Examples:
     * /api/dashboard?status=IN_PROGRESS
     * /api/dashboard?priority=HIGH
     * /api/dashboard?status=DONE&priority=HIGH
     */
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;

    const validStatuses = [
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
    ] as const;

    const validPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ] as const;

    if (
      status &&
      !validStatuses.includes(
        status as (typeof validStatuses)[number]
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status filter",
      });
    }

    if (
      priority &&
      !validPriorities.includes(
        priority as (typeof validPriorities)[number]
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority filter",
      });
    }

    /*
     * Base filters enforce RBAC.
     * Query filters are added on top of them.
     */
    let projectWhere: any = {};
    let taskWhere: any = {};

    if (role === "PROJECT_MANAGER") {
      projectWhere = {
        managerId: req.user.userId,
      };

      taskWhere = {
        project: {
          managerId: req.user.userId,
        },
      };
    }

    if (role === "DEVELOPER") {
      taskWhere = {
        developerId: req.user.userId,
      };
    }

    /*
     * Apply optional dashboard filters.
     */
    if (status) {
      taskWhere.status = status;
    }

    if (priority) {
      taskWhere.priority = priority;
    }

    /*
     * Admin sees all projects/tasks.
     * PM sees only their projects/tasks.
     * Developer sees only assigned tasks.
     */
    const [
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      completedTasks,
      overdueTasks,
    ] = await Promise.all([
      prisma.project.count({
        where: projectWhere,
      }),

      prisma.task.count({
        where: taskWhere,
      }),

      prisma.task.count({
        where: {
          ...taskWhere,
          status: "TODO",
        },
      }),

      prisma.task.count({
        where: {
          ...taskWhere,
          status: "IN_PROGRESS",
        },
      }),

      prisma.task.count({
        where: {
          ...taskWhere,
          status: "IN_REVIEW",
        },
      }),

      prisma.task.count({
        where: {
          ...taskWhere,
          status: "DONE",
        },
      }),

      prisma.task.count({
        where: {
          ...taskWhere,
          dueDate: {
            lt: new Date(),
          },
          status: {
            not: "DONE",
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      dashboard: {
        role,
        filters: {
          status: status ?? null,
          priority: priority ?? null,
        },
        totalProjects,
        totalTasks,
        tasksByStatus: {
          TODO: todoTasks,
          IN_PROGRESS: inProgressTasks,
          IN_REVIEW: inReviewTasks,
          DONE: completedTasks,
        },
        overdueTasks,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

