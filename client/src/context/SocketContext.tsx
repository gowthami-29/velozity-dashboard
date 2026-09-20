import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getSocket, disconnectSocket } from "../services/socket";

import type { Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext =
  createContext<SocketContextValue>({
    socket: null,
    connected: false,
  });

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({
  children,
}: SocketProviderProps) => {
  const [socket, setSocket] =
    useState<Socket | null>(null);

  const [connected, setConnected] =
    useState(false);

  useEffect(() => {
    const socketInstance = getSocket();

    setSocket(socketInstance);

    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socketInstance.id
      );

      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");

      setConnected(false);
    };

    socketInstance.on(
      "connect",
      handleConnect
    );

    socketInstance.on(
      "disconnect",
      handleDisconnect
    );

    if (socketInstance.connected) {
      setConnected(true);
    }

    return () => {
      socketInstance.off(
        "connect",
        handleConnect
      );

      socketInstance.off(
        "disconnect",
        handleDisconnect
      );

      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () =>
  useContext(SocketContext);