import type { Response } from "express";
import prisma from "../utils/prisma.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { getIO } from "../websocket/socket.js";
export const getNotifications = async (
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

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
    });

    return res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const markNotificationRead = async (
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

    const notificationId = String(
  req.params.notificationId
);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: req.user.userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.isRead) {
      const unreadCount = await prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
      });

      return res.json({
        success: true,
        message: "Notification already marked as read",
        unreadCount,
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
    });

    const io = getIO();

    io.to(`user:${req.user.userId}`).emit(
      "notification-unread-count",
      {
        unreadCount,
      }
    );

    return res.json({
      success: true,
      message: "Notification marked as read",
      notification: updatedNotification,
      unreadCount,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};