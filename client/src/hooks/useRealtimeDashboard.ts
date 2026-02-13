import { useQuery } from '@tanstack/react-query';
import { useRealtimeEvents } from './useRealtimeEvents';

export interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingOrders: number;
  unreadMessages: number;
  totalCustomers: number;
  totalDishes: number;
  totalEvents: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'message' | 'conversation' | 'event';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  metadata?: Record<string, any>;
}

// Fetch dashboard statistics
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/admin/dashboard/stats', {
    credentials: 'include'
  });
  
  if (!response.ok) {
    console.error('Dashboard stats fetch failed:', response.status, response.statusText);
    throw new Error('Failed to fetch dashboard stats');
  }
  
  const data = await response.json();
  return data; // Return the data directly
}

// Fetch recent activity
async function fetchRecentActivity(): Promise<RecentActivity[]> {
  const response = await fetch('/api/admin/dashboard/recent-activity', {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }
  
  return response.json();
}

export function useRealtimeDashboard() {
  // Fetch dashboard statistics - OPTIMISÉ: moins de requêtes
  const statsQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 2 * 60 * 1000, // 2 minutes au lieu de 30 secondes
    staleTime: 60 * 1000, // Fresh pendant 1 minute
    gcTime: 5 * 60 * 1000, // Garde en cache 5 minutes
  });

  // Fetch recent activity - OPTIMISÉ: moins fréquent
  const activityQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'activity'],
    queryFn: fetchRecentActivity,
    refetchInterval: 3 * 60 * 1000, // 3 minutes
    staleTime: 90 * 1000, // Fresh pendant 1.5 minutes
    gcTime: 5 * 60 * 1000,
  });

  // Set up real-time event handling - SEULEMENT pour événements critiques
  const { isConnected, connectionError } = useRealtimeEvents({
    onEvent: (event) => {
      // SEULEMENT invalider les queries pour les événements qui comptent vraiment
      if (['new_order', 'new_message', 'order_status_changed'].includes(event.type)) {
        // Ces événements nécessitent une mise à jour immédiate
      }
      // Ignorer heartbeat, connected, etc.
    }
  });

  return {
    // Statistics data
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    statsError: statsQuery.error,
    
    // Activity data
    activity: activityQuery.data,
    activityLoading: activityQuery.isLoading,
    activityError: activityQuery.error,
    
    // Real-time connection status
    isConnected,
    connectionError,
    
    // Refetch functions
    refetchStats: statsQuery.refetch,
    refetchActivity: activityQuery.refetch,
    
    // Overall loading state
    isLoading: statsQuery.isLoading || activityQuery.isLoading,
    
    // Overall error state
    hasError: !!statsQuery.error || !!activityQuery.error || !!connectionError
  };
}