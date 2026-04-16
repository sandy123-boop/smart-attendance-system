import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from './Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function SessionNotifier() {
  const { socket } = useSocket();
  const { addToast } = useToast();
  const { auth } = useAuth();

  useEffect(() => {
    if (!socket || auth?.user?.role !== 'student') return;

    const handler = ({ session }) => {
      addToast(
        `New session: "${session.title}" in ${session.class?.name || 'class'} — Scan QR to mark attendance!`,
        'info',
        8000
      );
    };

    socket.on('session:created', handler);
    return () => socket.off('session:created', handler);
  }, [socket, auth?.user?.role, addToast]);

  return null;
}
