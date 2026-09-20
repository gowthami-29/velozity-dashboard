
import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";

interface TaskStatusUpdate {
  taskId: string;
  projectId: string;
  title: string;
  fromStatus: string;
  toStatus: string;
  changedBy: {
    userId: string;
    role: string;
  };
  timestamp: string;
}

const PROJECT_ID = "b179e0f3-08e0-4749-b6aa-358f4b576432";

const SocketTest = () => {
  const socket = getSocket();

  const [connected, setConnected] = useState(socket.connected);
  const [lastUpdate, setLastUpdate] =
    useState<TaskStatusUpdate | null>(null);

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);

      console.log("Socket connected:", socket.id);

      socket.emit("join-project", PROJECT_ID);

      console.log("Joined project:", PROJECT_ID);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleTaskUpdate = (data: TaskStatusUpdate) => {
      console.log("Task status update received:", data);
      setLastUpdate(data);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("task-status-updated", handleTaskUpdate);

    if (socket.connected) {
      setConnected(true);
      socket.emit("join-project", PROJECT_ID);
    }

    return () => {
      socket.emit("leave-project", PROJECT_ID);

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("task-status-updated", handleTaskUpdate);
    };
  }, [socket]);

  return (
    <div>
      <h2>Real-Time Connection</h2>

      <p>
        Status: {connected ? "Connected ✅" : "Disconnected ❌"}
      </p>

      {lastUpdate && (
        <div>
          <h3>Latest Task Update</h3>

          <p>Task: {lastUpdate.title}</p>

          <p>
            Status: {lastUpdate.fromStatus} →{" "}
            {lastUpdate.toStatus}
          </p>

          <p>Changed by: {lastUpdate.changedBy.role}</p>

          <p>
            Time:{" "}
            {new Date(
              lastUpdate.timestamp
            ).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default SocketTest;

