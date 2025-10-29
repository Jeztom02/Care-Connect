import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Role } from '@/types';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
  role?: Role;
}

type WebSocketContextType = {
  sendMessage: (message: WebSocketMessage) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  isConnected: boolean;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const eventHandlers = useRef<Map<string, Set<(data: any) => void>>(new Map());
  const isConnecting = useRef(false);
  const isConnected = useRef(false);

  const connect = () => {
    if (isConnecting.current || isConnected.current) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.host}/ws`;
    
    try {
      isConnecting.current = true;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        isConnected.current = true;
        reconnectAttempts.current = 0;
        isConnecting.current = false;
        
        // Authenticate with the server
        if (user?.token) {
          sendMessage({
            type: 'AUTH',
            payload: { token: user.token },
            timestamp: new Date().toISOString(),
          });
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const handlers = eventHandlers.current.get(message.type);
          
          if (handlers) {
            handlers.forEach(handler => handler(message.payload));
          }

          // Handle specific message types
          switch (message.type) {
            case 'NOTIFICATION':
              handleNotification(message.payload);
              break;
            case 'DATA_UPDATE':
              handleDataUpdate(message.payload);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        isConnected.current = false;
        isConnecting.current = false;
        
        // Attempt to reconnect
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current - 1);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          setTimeout(connect, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.current?.close();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      isConnecting.current = false;
    }
  };

  const handleNotification = (notification: any) => {
    toast({
      title: notification.title || 'Notification',
      description: notification.message,
      variant: notification.type || 'default',
      duration: 5000,
    });
  };

  const handleDataUpdate = (update: any) => {
    // Invalidate relevant queries or update local state
    console.log('Data updated:', update);
    // You can add more specific update handling here
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        ...message,
        userId: user?.id,
        role: user?.role,
      }));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  };

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (!eventHandlers.current.has(event)) {
      eventHandlers.current.set(event, new Set());
    }
    
    const handlers = eventHandlers.current.get(event)!;
    handlers.add(callback);

    // Return unsubscribe function
    return () => {
      handlers.delete(callback);
      if (handlers.size === 0) {
        eventHandlers.current.delete(event);
      }
    };
  };

  // Connect on mount and when user changes
  useEffect(() => {
    if (user?.token) {
      connect();
    }

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      isConnected.current = false;
      isConnecting.current = false;
      eventHandlers.current.clear();
    };
  }, [user?.token]);

  return (
    <WebSocketContext.Provider
      value={{
        sendMessage,
        subscribe,
        isConnected: isConnected.current,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
