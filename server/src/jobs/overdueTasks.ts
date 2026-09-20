
import cron from "node-cron";
import prisma from "../utils/prisma.js";
import { getIO } from "../websocket/socket.js";

export const startOverdueTaskJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            not: "DONE",
          },
        },
        select: {
          id: true,
          title: true,
          developerId: true,
          dueDate: true,
          projectId: true,
        },
      });

      const io = getIO();

      for (const task of overdueTasks) {
        /*
         * Prevent duplicate overdue notifications.
         */
        const existingNotification =
          await prisma.notification.findFirst({
            where: {
              userId: task.developerId,
              type: "TASK_OVERDUE",
              message: {
                contains: `(${task.id})`,
              },
            },
          });

        if (existingNotification) {
          continue;
        }

        const notification =
          await prisma.notification.create({
            data: {
              userId: task.developerId,
              type: "TASK_OVERDUE",
              message: `Task "${task.title}" (${task.id}) is overdue.`,
            },
          });

        /*
         * Calculate the developer's current unread count.
         */
        const unreadCount =
          await prisma.notification.count({
            where: {
              userId: task.developerId,
              isRead: false,
            },
          });

        /*
         * Notify the assigned developer in real time.
         */
        io.to(`user:${task.developerId}`).emit(
          "notification-created",
          {
            notification,
            unreadCount,
          }
        );

        /*
         * Notify users currently watching the project.
         */
        io.to(`project:${task.projectId}`).emit(
          "task-overdue",
          {
            taskId: task.id,
            projectId: task.projectId,
            title: task.title,
            developerId: task.developerId,
            dueDate: task.dueDate,
            timestamp: new Date().toISOString(),
          }
        );
      }

      console.log(
        `Overdue task job completed. Found ${overdueTasks.length} overdue tasks.`
      );
    } catch (error) {
      console.error("Overdue task job error:", error);
    }
  });

  console.log("Overdue task background job started.");
};

