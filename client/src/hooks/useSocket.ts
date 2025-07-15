import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Notification } from '../types/notification';
import { useAuth } from '../contexts/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, token, loading } = useAuth();

  // Usunięto fetchUnreadMessagesCount - liczniki są zarządzane przez UnreadMessagesContext

  const connect = () => {
    if (!token || loading || connectingRef.current || socketRef.current?.connected) {
      return;
    }

    // Wyczyść poprzedni timeout reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    connectingRef.current = true;
    
    try {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 20000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: true,
        reconnectionDelayMax: 5000
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        connectingRef.current = false;
        
        // Usunięto fetchUnreadMessagesCount() - liczniki są zarządzane przez UnreadMessagesContext
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
        connectingRef.current = false;
        
        // Jeśli to nie jest celowe rozłączenie, spróbuj ponownie połączyć
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          // Celowe rozłączenie - nie próbuj ponownie
          return;
        }
        
        // Automatyczne ponowne połączenie po 3 sekundach
        if (token && !loading) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (token && !loading && !socketRef.current?.connected) {
              connect();
            }
          }, 3000);
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
        connectingRef.current = false;
        
        // Spróbuj ponownie połączyć po błędzie
        if (token && !loading) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (token && !loading && !socketRef.current?.connected) {
              connect();
            }
          }, 5000);
        }
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log('WebSocket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        connectingRef.current = false;
      });

      socketRef.current.on('reconnect_error', (error) => {
        console.error('WebSocket reconnection error:', error);
      });

      socketRef.current.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed after all attempts');
        connectingRef.current = false;
      });

      // Obsługa nowych powiadomień
      socketRef.current.on('new_notification', (notification: Notification) => {
        // Emituj eventy dla globalnych liczników
        if (notification.type === 'MESSAGE_RECEIVED') {
          window.dispatchEvent(new Event('new_message'));
        }
        if (notification.type === 'ADMIN_MESSAGE' || notification.type === 'ADMIN_MESSAGE_REPLY') {
          window.dispatchEvent(new Event('new_admin_message'));
        }
        
        // Usunięto fetchUnreadMessagesCount() - liczniki są zarządzane przez UnreadMessagesContext
      });

      // Obsługa błędów
      socketRef.current.on('error', (error: string) => {
        console.error('Socket error:', error);
      });

    } catch (error) {
      console.error('Error creating socket connection:', error);
      connectingRef.current = false;
    }
  };

  const disconnect = () => {
    // Wyczyść timeout reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting socket:', error);
      }
      socketRef.current = null;
      setIsConnected(false);
      connectingRef.current = false;
    }
  };

  // Auto-connect when token is available and not loading
  useEffect(() => {
    if (token && !loading && !socketRef.current && !connectingRef.current) {
      connect();
    } else if (!token || loading) {
      // Jeśli nie ma tokenu lub jest ładowanie, rozłącz
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [token, loading]);

  // Listen for token changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue && !loading) {
          // Token added - connect
          connect();
        } else {
          // Token removed - disconnect
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loading]);

  return {
    isConnected
  };
}; 