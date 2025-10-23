import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const s = io(API_BASE, {
      transports: ['websocket'],
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    socketRef.current = s;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.close();
      socketRef.current = null;
    };
  }, []);

  return useMemo(() => ({
    socket: socketRef.current,
    connected,
    on: (event: string, handler: (...args: any[]) => void) => socketRef.current?.on(event, handler),
    off: (event: string, handler?: (...args: any[]) => void) => socketRef.current?.off(event, handler as any),
    emit: (event: string, ...args: any[]) => socketRef.current?.emit(event, ...args),
  }), [connected]);
}
