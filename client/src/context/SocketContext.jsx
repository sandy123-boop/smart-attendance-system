import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io as ioClient } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { auth } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!auth?.token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // In production VITE_SERVER_URL must point to the Render backend
    // e.g. https://your-app.onrender.com
    // In local dev '/' works because the Vite proxy forwards socket.io traffic
    const serverUrl = import.meta.env.VITE_SERVER_URL || '/';
    const socket = ioClient(serverUrl, {
      auth: { token: auth.token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [auth?.token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext) || { socket: null, connected: false };
}
