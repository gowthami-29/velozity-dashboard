
import type { Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { getIO } from "../websocket/socket.js";
import { broadcastActivity } from "../services/activity.service.js";

/*
 * CREATE TASK
 */
export const createTask = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      title,
      description,
      projectId,
      developerId,
      priority,
      dueDate,
    } = req.body;

    if (
      user.role !== "ADMIN" &&
      user.role !== "PROJECT_MANAGER"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create tasks",
      });
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        name: true,
        managerId: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (
      user.role === "PROJECT_MANAGER" &&
      project.managerId !== user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only create tasks in your own projects",
      });
    }

    const developer = await prisma.user.findFirst({
      where: {
        id: developerId,
        role: "DEVELOPER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!developer) {
      return res.status(400).json({
        success: false,
        message: "Invalid developer",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description?.trim() || null,
        projectId,
        developerId,
        priority,
        dueDate: new Date(dueDate),
      },

      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },

        developer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const activity = await prisma.activityLog.create({
      data: {
        taskId: task.id,
        userId: user.userId,
        fromStatus: null,
        toStatus: task.status,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });

    broadcastActivity({
      id: activity.id,
      taskId: activity.taskId,
      projectId: activity.task.projectId,
      taskTitle: activity.task.title,
      projectName: task.project.name,
      userId: activity.user.id,
      userName: activity.user.name,
      userEmail: activity.user.email,
      userRole: activity.user.role,
      action: "TASK_CREATED",
      fromStatus: activity.fromStatus,
      toStatus: activity.toStatus,
      createdAt: activity.createdAt.toISOString(),
    });

    const notification =
      await prisma.notification.create({
        data: {
          userId: developer.id,
          type: "TASK_ASSIGNED",
          message: `You have been assigned a new task: ${task.title}`,
        },
      });

    try {
      const io = getIO();

      const unreadCount =
        await prisma.notification.count({
          where: {
            userId: developer.id,
            isRead: false,
          },
        });

      io.to(`user:${developer.id}`).emit(
        "notification-created",
        {
          notification,
          unreadCount,
        }
      );
    } catch (socketError) {
      console.error(
        "Task notification socket error:",
        socketError
      );
    }

    try {
      const io = getIO();

      io.to(`project:${project.id}`).emit(
        "task-created",
        {
          task,
        }
      );
    } catch (socketError) {
      console.error(
        "Task creation socket error:",
        socketError
      );
    }

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};


/*
 * UPDATE TASK STATUS
 */
export const updateTaskStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const rawTaskId = req.params.taskId;

    const taskId = Array.isArray(rawTaskId)
      ? rawTaskId[0]
      : rawTaskId;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task ID is required",
      });
    }

    const { status } = req.body;

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        project: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },

        developer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (
      user.role === "PROJECT_MANAGER" &&
      task.project.managerId !== user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update tasks in your own projects",
      });
    }

    if (
      user.role === "DEVELOPER" &&
      task.developerId !== user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update your assigned tasks",
      });
    }

    if (task.status === status) {
      return res.status(200).json({
        success: true,
        message: "Task status is already set",
        task,
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const updatedTask =
          await tx.task.update({
            where: {
              id: taskId,
            },

            data: {
              status,
            },
          });

        const activity =
          await tx.activityLog.create({
            data: {
              taskId: task.id,
              userId: user.userId,
              fromStatus: task.status,
              toStatus: status,
            },

            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },

              task: {
                select: {
                  id: true,
                  title: true,
                  projectId: true,
                },
              },
            },
          });

        let notification = null;

        if (task.developerId !== user.userId) {
          notification =
            await tx.notification.create({
              data: {
                userId: task.developerId,
                type: "TASK_STATUS_CHANGED",
                message: `Task "${task.title}" status changed from ${task.status} to ${status}`,
              },
            });
        }

        return {
          updatedTask,
          activity,
          notification,
        };
      }
    );

    broadcastActivity({
      id: result.activity.id,
      taskId: result.activity.taskId,
      projectId:
        result.activity.task.projectId,
      taskTitle:
        result.activity.task.title,
      projectName:
        task.project.name,
      userId:
        result.activity.user.id,
      userName:
        result.activity.user.name,
      userEmail:
        result.activity.user.email,
      userRole:
        result.activity.user.role,
      action: "TASK_STATUS_CHANGED",
      fromStatus:
        result.activity.fromStatus,
      toStatus:
        result.activity.toStatus,
      createdAt:
        result.activity.createdAt.toISOString(),
    });

    const io = getIO();

    io.to(
      `project:${task.project.id}`
    ).emit(
      "task-status-updated",
      {
        taskId: result.updatedTask.id,
        projectId: task.project.id,
        title: result.updatedTask.title,
        fromStatus: task.status,
        toStatus: result.updatedTask.status,
        changedBy: user.userId,
        timestamp:
          result.updatedTask.updatedAt.toISOString(),
      }
    );

    let unreadCount: number | undefined;

    if (result.notification) {
      unreadCount =
        await prisma.notification.count({
          where: {
            userId: task.developerId,
            isRead: false,
          },
        });

      io.to(
        `user:${task.developerId}`
      ).emit(
        "notification-created",
        {
          notification:
            result.notification,
          unreadCount,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task: result.updatedTask,
      notification: result.notification,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Update task status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update task status",
    });
  }
};


/*
 * GET TASKS
 */
export const getTasks = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      status,
      priority,
      projectId,
      developerId,
      overdue,
    } = req.query;

    const where: any = {};

    if (
      typeof status === "string" &&
      [
        "TODO",
        "IN_PROGRESS",
        "IN_REVIEW",
        "DONE",
      ].includes(status)
    ) {
      where.status = status;
    }

    if (
      typeof priority === "string" &&
      [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
      ].includes(priority)
    ) {
      where.priority = priority;
    }

    if (typeof projectId === "string") {
      where.projectId = projectId;
    }

    /*
     * Developers only see their own tasks.
     */
    if (user.role === "DEVELOPER") {
      where.developerId = user.userId;
    }

    /*
     * Project Managers only see tasks
     * belonging to their own projects.
     */
    if (
      user.role === "PROJECT_MANAGER"
    ) {
      where.project = {
        managerId: user.userId,
      };
    }

    /*
     * Admin can filter by developer.
     */
    if (
      user.role === "ADMIN" &&
      typeof developerId === "string"
    ) {
      where.developerId = developerId;
    }

    /*
     * Overdue tasks.
     */
    if (overdue === "true") {
      where.dueDate = {
        lt: new Date(),
      };

      where.status = {
        not: "DONE",
      };
    }

    const tasks =
      await prisma.task.findMany({
        where,

        include: {
          project: {
            select: {
              id: true,
              name: true,
              managerId: true,
            },
          },

          developer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },

        orderBy: [
          {
            dueDate: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      });

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error(
      "Get tasks error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load tasks",
    });
  }
};

