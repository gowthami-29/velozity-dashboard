
import { getIO } from "../websocket/socket.js";
import prisma from "../utils/prisma.js";

interface ActivityEvent {
  id: string;
  taskId: string;
  projectId: string;
  taskTitle: string;
  projectName?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole: string;
  action?: string;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
}

export const broadcastActivity = async (
  activity: ActivityEvent
) => {
  const io = getIO();

  const action =
    activity.action ??
    (activity.fromStatus === null
      ? "TASK_CREATED"
      : "TASK_STATUS_CHANGED");

  const activityPayload = {
    id: activity.id,
    action,
    entityType: "TASK",
    entityId: activity.taskId,
    description: activity.taskTitle
      ? `${action.replaceAll("_", " ").toLowerCase()} — ${activity.taskTitle}`
      : action,
    createdAt: activity.createdAt,

    user: {
      id: activity.userId,
      name: activity.userName,
      email: activity.userEmail ?? "",
    },

    project: {
      id: activity.projectId,
      name: activity.projectName ?? "Project",
    },

    taskId: activity.taskId,
    taskTitle: activity.taskTitle,
    fromStatus: activity.fromStatus,
    toStatus: activity.toStatus,
  };

  /*
   * Admin receives the global activity feed.
   */
  io.to("role:ADMIN").emit(
    "activity-created",
    activityPayload
  );

  /*
   * Users currently watching the project
   * receive the activity immediately.
   */
  io.to(`project:${activity.projectId}`).emit(
    "activity-created",
    activityPayload
  );

  /*
   * Find the project and task owner so we can
   * deliver the activity to their personal rooms.
   */
  const project = await prisma.project.findUnique({
    where: {
      id: activity.projectId,
    },
    select: {
      managerId: true,
    },
  });

  const task = await prisma.task.findUnique({
    where: {
      id: activity.taskId,
    },
    select: {
      developerId: true,
    },
  });

  /*
   * Project Manager receives activity from
   * projects they manage.
   */
  if (project?.managerId) {
    io.to(`user:${project.managerId}`).emit(
      "activity-created",
      activityPayload
    );
  }

  /*
   * Assigned Developer receives activity from
   * their assigned task.
   */
  if (task?.developerId) {
    io.to(`user:${task.developerId}`).emit(
      "activity-created",
      activityPayload
    );
  }
};

