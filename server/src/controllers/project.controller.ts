import type { Response } from "express";
import prisma from "../utils/prisma.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";


export const createProject = async (
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

    const {
      name,
      description,
      clientId,
      managerId,
    } = req.body;

    if (!name || !clientId) {
      return res.status(400).json({
        success: false,
        message: "name and clientId are required",
      });
    }

    /*
     * Project Manager:
     * They can only create projects for themselves.
     */
    let assignedManagerId = req.user.userId;

    /*
     * Admin:
     * Admin can assign the project to a Project Manager.
     */
    if (req.user.role === "ADMIN") {
      if (!managerId) {
        return res.status(400).json({
          success: false,
          message:
            "managerId is required when an Admin creates a project",
        });
      }

      const manager = await prisma.user.findFirst({
        where: {
          id: managerId,
          role: "PROJECT_MANAGER",
        },
      });

      if (!manager) {
        return res.status(400).json({
          success: false,
          message:
            "managerId must belong to a Project Manager",
        });
      }

      assignedManagerId = manager.id;
    }

    /*
     * Verify client exists.
     */
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        clientId,
        managerId: assignedManagerId,
      },

      include: {
        client: true,

        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error(
      "Create project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getProjects = async (
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

    const { status, priority } = req.query;

    const where: any = {};

    // -------------------------
    // ROLE-BASED ACCESS
    // -------------------------

    if (req.user.role === "PROJECT_MANAGER") {
      where.managerId = req.user.userId;
    }

    if (req.user.role === "DEVELOPER") {
      where.tasks = {
        some: {
          developerId: req.user.userId,
        },
      };
    }

    // -------------------------
    // TASK FILTERS
    // -------------------------

    const taskWhere: any = {};

    if (status) {
      taskWhere.status = String(status);
    }

    if (priority) {
      taskWhere.priority = String(priority);
    }

    // Developer can only see their own tasks
    if (req.user.role === "DEVELOPER") {
      taskWhere.developerId = req.user.userId;
    }

    // Only add task filtering when needed
    const hasTaskFilters =
      Object.keys(taskWhere).length > 0;

    if (hasTaskFilters) {
      where.tasks = {
        ...(where.tasks || {}),
        some: taskWhere,
      };
    }

    // -------------------------
    // DATABASE QUERY
    // -------------------------

    const projects = await prisma.project.findMany({
      where,

      include: {
        client: true,

        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        tasks: {
          where: hasTaskFilters
            ? taskWhere
            : req.user.role === "DEVELOPER"
              ? {
                  developerId: req.user.userId,
                }
              : undefined,

          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            developerId: true,

            developer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};


export const getProjectById = async (
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

    const projectId = String(
  req.params.projectId
);

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        client: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        tasks: {
          include: {
            developer: {
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
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // PM → only their own project
    if (
      req.user.role === "PROJECT_MANAGER" &&
      project.managerId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own projects",
      });
    }

    // Developer → only projects containing their assigned tasks
    if (req.user.role === "DEVELOPER") {
      const hasAssignedTask = project.tasks.some(
        (task) => task.developerId === req.user!.userId
      );

      if (!hasAssignedTask) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this project",
        });
      }
    }

    return res.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};