import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: (cb) => {
        const token = localStorage.getItem("accessToken");

        cb({
          token,
        });
      },
    });

    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};