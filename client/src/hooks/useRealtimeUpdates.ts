import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeEvent {
  type: string;
  data?: any;
  message?: string;
  timestamp: string;
}

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    setLastEvent(event);
    
    switch (event.type) {
      case 'connected':
        setIsConnected(true);
        console.log('Connected to real-time updates');
        break;
        
      case 'heartbeat':
        // Keep connection alive
        break;
        
      case 'new_order':
        // Invalidate order-related queries
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-activity'] });
        break;
        
      case 'order_updated':
        // Invalidate order-related queries
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-activity'] });
        break;
        
      case 'new_message':
        // Invalidate message-related queries
        queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-activity'] });
        break;
        
      case 'new_conversation':
        // Invalidate conversation-related queries
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-activity'] });
        break;
        
      case 'system_update':
        // Invalidate all queries for system updates
        queryClient.invalidateQueries();
        break;
        
      case 'data_updated':
        // Generic data update - invalidate specific queries if provided
        if (event.data?.queryKeys) {
          event.data.queryKeys.forEach((key: string[]) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        } else {
          // Invalidate common dashboard queries
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-activity'] });
        }
        break;
        
      default:
        console.log('Unknown real-time event:', event);
    }
  }, [queryClient]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('SSE connection already exists, skipping');
      return; // Already connected
    }

    console.log('🔗 Attempting to establish SSE connection to /api/admin/sse');
    
    try {
      eventSourceRef.current = new EventSource('/api/admin/sse', {
        withCredentials: true
      });

      eventSourceRef.current.onopen = () => {
        console.log('✅ SSE connection opened successfully');
        setIsConnected(true);
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        console.log('SSE readyState:', eventSourceRef.current?.readyState);
        console.log('SSE url:', eventSourceRef.current?.url);
        setIsConnected(false);
        
        // Check if it's an authentication error (readyState 2 = CLOSED)
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log('🔄 SSE connection closed, attempting to reconnect in 3 seconds...');
          eventSourceRef.current = null;
          
          // Attempt to reconnect after a delay
          setTimeout(() => {
            connect();
          }, 3000);
        }
      };

    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      setIsConnected(false);
    }
  }, [handleRealtimeEvent]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    connect,
    disconnect
  };
}