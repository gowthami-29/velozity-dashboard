import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

interface SocketUser {
  userId: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
}

let io: Server | null = null;

const getTokenFromSocket = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return authToken;
  }

  const authHeader = socket.handshake.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
};

const verifySocketUser = (socket: Socket): SocketUser | null => {
  try {
    const token = getTokenFromSocket(socket);

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as SocketUser;

    if (!decoded.userId || !decoded.role) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

const canAccessProject = async (
  user: SocketUser,
  projectId: string
) => {
  if (user.role === "ADMIN") {
    return true;
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      managerId: true,
      tasks: {
        select: {
          developerId: true,
        },
      },
    },
  });

  if (!project) {
    return false;
  }

  if (user.role === "PROJECT_MANAGER") {
    return project.managerId === user.userId;
  }

  if (user.role === "DEVELOPER") {
    return project.tasks.some(
      (task) => task.developerId === user.userId
    );
  }

  return false;
};

export const initializeSocket = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: {
      origin:[ "http://localhost:5173",
       "http://localhost:5174",
       "https://velozity-dashboard-beta.vercel.app",
  ],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const user = verifySocketUser(socket);

    if (!user) {
      return next(new Error("Socket authentication failed"));
    }

    socket.data.user = user;

    next();
  });

  io.on("connection", (socket) => {
  const user =
    socket.data.user as SocketUser;

  socket.join(`user:${user.userId}`);

  if (user.role === "ADMIN") {
    socket.join("role:ADMIN");
  }

  console.log(
    `Socket connected: ${socket.id} | ${user.role} | ${user.userId}`
  );

  socket.on(
    "join-project",
    async (projectId: string) => {
      try {
        const allowed =
          await canAccessProject(
            user,
            projectId
          );

        if (!allowed) {
          socket.emit(
            "socket-error",
            {
              message:
                "You do not have access to this project",
            }
          );

          return;
        }

        socket.join(
          `project:${projectId}`
        );

        console.log(
          `${user.role} ${user.userId} joined project:${projectId}`
        );
      } catch (error) {
        console.error(
          "Socket project access error:",
          error
        );

        socket.emit(
          "socket-error",
          {
            message:
              "Unable to join project",
          }
        );
      }
    }
  );

  socket.on(
    "leave-project",
    (projectId: string) => {
      socket.leave(
        `project:${projectId}`
      );

      console.log(
        `${user.role} ${user.userId} left project:${projectId}`
      );
    }
  );

  socket.on("disconnect", () => {
    console.log(
      `Socket disconnected: ${socket.id}`
    );
  });
});

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};