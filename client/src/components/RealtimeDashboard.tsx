import React from 'react';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  DollarSign, 
  MessageSquare, 
  Users,
  Activity,
  AlertCircle
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  loading?: boolean;
}

function StatsCard({ title, value, change, icon: Icon, loading = false }: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const changeColor = change && change > 0 ? 'text-green-600' : change && change < 0 ? 'text-red-600' : 'text-gray-600';
  const ChangeIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : Activity;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`text-xs ${changeColor} flex items-center gap-1 mt-1`}>
            <ChangeIcon className="h-3 w-3" />
            <span>{change > 0 ? '+' : ''}{change}% ce mois</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RealtimeDashboard() {
  const {
    stats,
    activity,
    statsLoading,
    activityLoading,
    connectionError,
    hasError
  } = useRealtimeDashboard();

  console.log('RealtimeDashboard render:', { 
    stats, 
    statsLoading, 
    hasError 
  });

  useRealtimeEvents({
    onEvent: (event) => {
      // Handle real-time events here if needed
    }
  });

  if (hasError && !stats && !activity) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-800">Erreur de connexion</h3>
              <p className="text-red-600">Impossible de charger les données du tableau de bord.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with real-time status */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Commandes totales"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          loading={statsLoading}
        />
        
        <StatsCard
          title="Chiffre d'affaires"
          value={stats ? `$${stats.totalRevenue} CAD` : '$0.00 CAD'}
          icon={DollarSign}
          loading={statsLoading}
        />
        
        <StatsCard
          title="Messages non lus"
          value={stats?.unreadMessages || 0}
          icon={MessageSquare}
          loading={statsLoading}
        />
        
        <StatsCard
          title="Clients"
          value={stats?.totalCustomers || 0}
          icon={Users}
          loading={statsLoading}
        />
      </div>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Commandes aujourd'hui"
          value={stats?.todayOrders || 0}
          icon={ShoppingCart}
          loading={statsLoading}
        />
        
        <StatsCard
          title="Revenus aujourd'hui"
          value={stats ? `$${stats.todayRevenue || '0.00'} CAD` : '$0.00 CAD'}
          icon={DollarSign}
          loading={statsLoading}
        />
        
        <StatsCard
          title="Commandes en attente"
          value={stats?.pendingOrders || 0}
          icon={AlertCircle}
          loading={statsLoading}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="space-y-3">
              {activity.slice(0, 10).map((item, index) => (
                <div key={item.id || index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    item.type === 'order' ? 'bg-blue-500' :
                    item.type === 'message' ? 'bg-green-500' :
                    item.type === 'conversation' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}>
                    {item.type === 'order' ? '📦' :
                     item.type === 'message' ? '💬' :
                     item.type === 'conversation' ? '👥' :
                     '📅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune activité récente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}