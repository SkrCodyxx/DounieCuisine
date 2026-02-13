import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface RealtimeEvent {
  type: string;
  data?: any;
  message?: string;
  timestamp: string;
}

export interface UseRealtimeEventsOptions {
  onEvent?: (event: RealtimeEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions = {}) {
  const {
    onEvent,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 30000 // 30 secondes au lieu de 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/admin/sse', {
        withCredentials: true
      });

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        onConnect?.();
        // Real-time connection established
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          
          // Handle different event types
          switch (data.type) {
            case 'connected':
            case 'heartbeat':
              // These are system events, just log them
              break;
              
            case 'message_deleted':
              // Invalidate messages query to refresh the list
              queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats'] });
              break;
              
            case 'conversation_deleted':
              // Invalidate conversations query to refresh the list
              queryClient.invalidateQueries({ queryKey: ['admin', 'conversations'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats'] });
              break;
              
            case 'new_message':
              // Invalidate messages and dashboard stats
              queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats'] });
              break;
              
            case 'new_order':
              // Invalidate orders and dashboard stats
              queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats'] });
              break;
              
            case 'order_updated':
              // Invalidate orders and dashboard stats
              queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats'] });
              break;
              
            case 'stats_updated':
              // Refresh dashboard statistics
              queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats'] });
              queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'activity'] });
              break;
              
            default:
              // Handle custom events
              break;
          }

          // Call custom event handler
          onEvent?.(data);
          
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        setIsConnected(false);
        setConnectionError('Connection lost');
        onError?.(error);
        
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            // Reconnecting to real-time events
            connect();
          }, reconnectInterval);
        }
      };

    } catch (error) {
      setConnectionError('Failed to connect');
      console.error('Failed to establish SSE connection:', error);
    }
  }, [onEvent, onConnect, onDisconnect, onError, autoReconnect, reconnectInterval, queryClient]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    reconnect: connect
  };
}