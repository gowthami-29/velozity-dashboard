import type { Request, Response } from "express";
import prisma from "../utils/prisma.js";

import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
export const getRecentActivity = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const projectId =
      typeof req.query.projectId === "string"
        ? req.query.projectId
        : undefined;

    const where: any = {};

    /*
     * Optional project filter.
     */
    if (projectId) {
      where.task = {
        projectId,
      };
    }

    /*
     * Developers can only see activity
     * related to their own assigned tasks.
     */
    if (user.role === "DEVELOPER") {
      where.task = {
        ...(where.task ?? {}),
        developerId: user.userId,
      };
    }

    /*
     * Project Managers can only see activity
     * for projects they manage.
     */
    if (user.role === "PROJECT_MANAGER") {
      where.task = {
        ...(where.task ?? {}),
        project: {
          managerId: user.userId,
        },
      };
    }

    /*
     * Admin can see global activity.
     */
    const activities = await prisma.activityLog.findMany({
      where,

      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            developerId: true,

            project: {
              select: {
                id: true,
                name: true,
                managerId: true,
              },
            },
          },
        },

        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 20,
    });

    const formattedActivities = activities.map(
      (activity) => {
        /*
         * ActivityLog does not contain an `action`
         * column in the Prisma schema.
         *
         * Therefore derive the action from the
         * status transition.
         */
        const action =
          activity.fromStatus === null
            ? "TASK_CREATED"
            : "TASK_STATUS_CHANGED";

        return {
          id: activity.id,

          action,

          entityType: "TASK",

          entityId: activity.task?.id ?? null,

          description: activity.task?.title
            ? `${action
                .replaceAll("_", " ")
                .toLowerCase()} — ${activity.task.title}`
            : action,

          createdAt: activity.createdAt,

          user: activity.user
            ? {
                id: activity.user.id,
                name: activity.user.name,
                email: activity.user.email,
              }
            : null,

          project: activity.task?.project
            ? {
                id: activity.task.project.id,
                name: activity.task.project.name,
              }
            : null,

          taskId: activity.task?.id ?? null,

          taskTitle: activity.task?.title ?? null,

          fromStatus: activity.fromStatus,

          toStatus: activity.toStatus,
        };
      }
    );

    return res.status(200).json({
      activities: formattedActivities,
    });
  } catch (error) {
    console.error(
      "Get recent activity error:",
      error
    );

    return res.status(500).json({
      message: "Failed to load activity",
    });
  }
};

