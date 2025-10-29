import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Get the base URL from environment or use default
const getApiBase = () => {
  // In development, use the same host as the current page with WebSocket protocol
  if (import.meta.env.DEV) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  // In production, use the configured API URL or default to WebSocket on the same host
  return import.meta.env.VITE_API_WS_URL || 
         (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + 
         '//' + (import.meta.env.VITE_API_URL || window.location.host);
};

const SOCKET_PATH = '/socket.io';
const API_BASE = getApiBase();

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: Error | null;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
}

export function useSocket(): UseSocketReturn {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // 1 second

  useEffect(() => {
    console.log('[useSocket] Initializing WebSocket connection...');
    const token = localStorage.getItem('authToken');
    console.log('[useSocket] Auth token found:', !!token);
    
    if (!token) {
      const errorMsg = 'No authentication token found';
      console.error(`[useSocket] ${errorMsg}`);
      setError(new Error(errorMsg));
      return;
    }
    
    // Add a small delay to prevent immediate reconnection attempts
    const connectTimeout = setTimeout(() => {

    const connect = () => {
      try {
        console.log('[useSocket] Creating socket connection to:', API_BASE);
        console.log('[useSocket] Creating socket connection to:', API_BASE);
        const s = io(API_BASE, {
          path: SOCKET_PATH,
          transports: ['websocket', 'polling'],
          auth: { token },
          extraHeaders: { 
            Authorization: `Bearer ${token}`,
            'X-Client-Version': '1.0.0',
            'X-Requested-With': 'XMLHttpRequest'
          },
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: reconnectDelay,
          reconnectionDelayMax: 5000,
          timeout: 30000, // Increased timeout to 30 seconds
          forceNew: true,
          upgrade: true,
          query: {
            clientType: 'web',
            timestamp: Date.now(),
            token: token // Also send token as query parameter for better compatibility
          }
        });
        
        console.log('[useSocket] Socket instance created, setting up event handlers...');

        s.on('connect', () => {
          console.log('[useSocket] WebSocket connected successfully');
          console.log('[useSocket] Socket ID:', s.id);
          setConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
          
          // Log connection details
          console.log('[useSocket] Connection details:', {
            connected: s.connected,
            disconnected: s.disconnected,
            auth: s.auth,
            id: s.id
          });
        });

        s.on('disconnect', (reason) => {
          console.log('[useSocket] WebSocket disconnected. Reason:', reason);
          setConnected(false);
          
          if (reason === 'io server disconnect') {
            console.log('[useSocket] Server initiated disconnect, attempting to reconnect...');
            // The server explicitly closed the connection, try to reconnect
            s.connect();
          }
        });

        s.on('connect_error', (err) => {
          console.error('[useSocket] WebSocket connection error:', {
            message: err.message,
            name: err.name,
            stack: err.stack,
            // @ts-ignore - Additional Socket.IO error details
            description: err.description,
            // @ts-ignore
            context: err.context,
            // @ts-ignore
            type: err.type
          });
          
          setError(new Error(`Connection error: ${err.message}`));
          setConnected(false);
          
          // Auto-reconnect logic
          reconnectAttempts.current += 1;
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = reconnectDelay * reconnectAttempts.current;
            console.log(`[useSocket] Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts}) in ${delay}ms...`);
            setTimeout(() => {
              console.log(`[useSocket] Attempting reconnection #${reconnectAttempts.current}...`);
              s.connect();
            }, delay);
          } else {
            console.error('[useSocket] Max reconnection attempts reached');
            setError(new Error('Failed to connect to the server. Please check your connection and refresh the page.'));
          }
        });

        socketRef.current = s;

        return () => {
          s.off('connect');
          s.off('disconnect');
          s.off('connect_error');
          s.close();
          socketRef.current = null;
        };
      } catch (err) {
        console.error('Error initializing WebSocket:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize WebSocket'));
      }
    };

    connect();

    // Cleanup on unmount
    }, 1000); // 1 second delay before attempting to connect
    
    return () => {
      clearTimeout(connectTimeout);
      if (socketRef.current) {
        console.log('[useSocket] Cleaning up WebSocket connection');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return useMemo(() => ({
    socket: socketRef.current,
    connected,
    error,
    on: (event: string, handler: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, handler);
      } else {
        console.warn(`Cannot attach listener to event '${event}': socket not initialized`);
      }
    },
    off: (event: string, handler?: (...args: any[]) => void) => {
      if (socketRef.current) {
        if (handler) {
          socketRef.current.off(event, handler);
        } else {
          socketRef.current.off(event);
        }
      }
    },
    emit: (event: string, ...args: any[]) => {
      if (socketRef.current?.connected) {
        return socketRef.current.emit(event, ...args);
      } else {
        console.warn(`Cannot emit '${event}': socket not connected`);
        return false;
      }
    },
  }), [connected, error]);
}
