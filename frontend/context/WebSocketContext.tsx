'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: WebSocketMessage | null;
  subscribeShelf: (shelfId: string) => void;
  unsubscribeShelf: (shelfId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000').replace(/^http/, 'ws');
    const fullUrl = `${wsUrl}/api/ws?token=${encodeURIComponent(token)}`;

    let socket: WebSocket;
    let isComponentMounted = true;

    const connectWS = () => {
      try {
        socket = new WebSocket(fullUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isComponentMounted) return;
          setIsConnected(true);
          console.log('[WebSocket] Connected');

          // Keep alive ping
          pingIntervalRef.current = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ action: 'ping' }));
            }
          }, 25000);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type !== 'pong') {
              console.log('[WebSocket] Event received:', data);
              setLastEvent(data);
            }
          } catch (e) {
            console.error('[WebSocket] Message parse error:', e);
          }
        };

        socket.onclose = () => {
          if (!isComponentMounted) return;
          setIsConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          console.log('[WebSocket] Disconnected. Reconnecting in 3s...');
          setTimeout(() => {
            if (isComponentMounted && token) {
              connectWS();
            }
          }, 3000);
        };

        socket.onerror = (err) => {
          console.error('[WebSocket] Error:', err);
        };
      } catch (e) {
        console.error('[WebSocket] Setup exception:', e);
      }
    };

    connectWS();

    return () => {
      isComponentMounted = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [token, user]);

  const subscribeShelf = (shelfId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'subscribe_shelf', shelf_id: shelfId }));
    }
  };

  const unsubscribeShelf = (shelfId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'unsubscribe_shelf', shelf_id: shelfId }));
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, subscribeShelf, unsubscribeShelf }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
