import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import {
  UtensilsCrossed,
  List,
  ShoppingCart,
  Calendar as CalendarIcon,
  CalendarDays,
  Presentation,
  Image,
  Star,
  Mail,
  MessageSquare,
  FileText,
  Activity,
  Map,
  MapPin,
  Settings,
  Database,
  Shield,
  Users,
  LogOut,
  Bell,
  CheckCheck,
  Menu,
  UserCircle,
  TestTube2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { format } from "date-fns";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  permission?: string; // admin_modules.name
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "Business",
    items: [
      { title: "Commandes", url: "/admin/orders", icon: ShoppingCart, permission: 'orders' },
      { title: "Zones de Livraison", url: "/admin/delivery-zones", icon: MapPin, permission: 'settings' },
    ],
  },
  {
    label: "Menus",
    items: [
      { title: "Menu À Emporter", url: "/admin/takeout-menu", icon: UtensilsCrossed, permission: 'menu' },
      { title: "Menu Traiteur", url: "/admin/catering-menu", icon: FileText, permission: 'menu' },
      { title: "Demandes de Devis", url: "/admin/catering-quotes", icon: FileText, permission: 'menu' },
    ],
  },
  {
    label: "Contenu",
    items: [
      { title: "Gestion Contenu", url: "/admin/content", icon: FileText, permission: 'content' },
      { title: "Communauté", url: "/admin/community", icon: Users, permission: 'community' },
    ],
  },
  {
    label: "Communications",
    items: [
      { title: "Messagerie", url: "/admin/messages", icon: MessageSquare, permission: 'content' },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Gestion Utilisateurs", url: "/admin/user-management", icon: Users, permission: 'users' },
      { title: "Paramètres Système", url: "/admin/settings-management", icon: Settings, permission: 'settings' },
      { title: "Tests Square", url: "/admin/square-test", icon: TestTube2, permission: 'settings' },
    ],
  },
];

export function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const { data: me } = useQuery<{ id: number; role: string }>({
    queryKey: ["/api/admin/auth/me"],
  });
  const { data: userPerms } = useQuery<Array<{ moduleName: string; canView: boolean }>>({
    queryKey: ['/api/admin/users', me?.id, 'permissions'],
    queryFn: async () => {
      if (!me?.id) return [] as any;
      const res = await fetch(`/api/admin/users/${me.id}/permissions`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch permissions');
      return res.json();
    },
    enabled: !!me?.id && me?.role !== 'super_admin'
  });

  const allowedModules = new Set<string>();
  if (me?.role === 'super_admin') {
    // super admin: allow all
    // Leave set empty and bypass checks below by returning true when super admin
  } else if (userPerms) {
    userPerms.forEach(p => { if (p.canView) allowedModules.add(p.moduleName); });
  }

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout");
      setLocation("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      setLocation("/admin/login");
    }
  };

  return (
    <Sidebar className="border-r-2 border-orange-100/50">
      <SidebarContent className="bg-gradient-to-b from-white via-orange-50/20 to-white">
        {/* Logo Section améliorée */}
        <div className="px-4 py-6 border-b-2 border-orange-200/40 bg-gradient-to-br from-orange-50/50 to-amber-50/30">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-2xl blur-xl"></div>
            <img 
              src="/logo.png" 
              alt="Dounie Cuisine Admin" 
              className="h-24 w-auto object-contain mx-auto relative z-10 drop-shadow-lg"
              data-testid="img-admin-sidebar-logo"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'block';
              }}
            />
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
              Administration
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Dounie Cuisine</p>
          </div>
        </div>

        {/* Menu Groups améliorés */}
        <ScrollArea className="flex-1 px-2 py-4">
          {menuGroups.map((group) => (
            <SidebarGroup key={group.label} className="mb-4">
              <SidebarGroupLabel className="text-xs uppercase font-bold text-orange-700/70 px-3 mb-2 tracking-wider">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items
                    .filter((item) => {
                      if (!item.permission) return true;
                      if (me?.role === 'super_admin') return true;
                      return allowedModules.has(item.permission);
                    })
                    .map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          data-active={location === item.url}
                          data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className="hover:bg-gradient-to-r hover:from-orange-100/80 hover:to-amber-100/60 hover:text-orange-700 transition-all duration-200 data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-500 data-[active=true]:to-amber-500 data-[active=true]:text-white data-[active=true]:shadow-md rounded-lg"
                        >
                          <a href={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </ScrollArea>

        {/* Logout Button amélioré */}
        <div className="p-4 border-t-2 border-orange-200/40 bg-gradient-to-br from-orange-50/30 to-amber-50/20">
          <Button
            variant="outline"
            className="w-full justify-start bg-white hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 hover:border-red-200 transition-all duration-200 border-2 shadow-sm"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-semibold">Déconnexion</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function AdminNotificationBell() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notificationsData, refetch } = useQuery<{ count: number; notifications: Notification[] }>({
    queryKey: ["/api/admin/notifications/unread"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/admin/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread"] });
      refetch();
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", "/api/admin/notifications/read-all", {}),
    onSuccess: () => {
      // Invalider TOUTES les queries de notifications pour forcer le rechargement
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread"] });
      refetch();
      setIsOpen(false);
      // Optimisme: mettre le compteur local immédiatement à zéro pour éviter badge persistant
      queryClient.setQueryData(["/api/admin/notifications/unread"], {
        count: 0,
        notifications: []
      });
    },
    onError: (error) => {
      console.error("Error marking all notifications as read:", error);
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsReadMutation.mutate(notification.id);

    // Redirect based on link or type
    let redirectPath = notification.link || "/admin/dashboard";
    
    // Fallback to type-based routing if no link
    if (!notification.link) {
      if (notification.type === "order_received") {
        redirectPath = `/admin/orders`;
      } else if (notification.type === "order_status_update") {
        redirectPath = `/admin/orders`;
      } else if (notification.type === "new_message") {
        redirectPath = `/admin/messages`;
      } else if (notification.type === "new_conversation") {
        redirectPath = `/admin/conversations`;
      } else if (notification.type === "new_quote_request") {
        redirectPath = `/admin/quotes`;
      } else if (notification.type === "new_customer") {
        redirectPath = `/admin/customers`;
      }
    }

    setIsOpen(false);
    setLocation(redirectPath);
  };

  const unreadCount = notificationsData?.count || 0;
  const notifications = notificationsData?.notifications || [];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Tout marquer
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="divide-y max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [, setLocation] = useLocation();

  // Initialize real-time updates with new hook
  useRealtimeEvents();

  // Vérifier l'authentification via /api/admin/auth/me
  const { data: me, isLoading, isError } = useQuery<{ id: number; email: string; username: string; role: string }>({
    queryKey: ["/api/admin/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/admin/auth/me", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Non authentifié');
      }
      
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });

  // L'utilisateur est authentifié si on a des données me
  const isAuthenticated = !!me?.id;

  useEffect(() => {
    if (!isLoading && (isError || !isAuthenticated)) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isLoading, isError, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-full w-full bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header amélioré */}
          <header className="flex-none border-b-2 border-orange-100/50 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden hover:bg-orange-100 transition-colors rounded-lg" />
                <div>
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                    Dashboard Admin
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gestion complète de votre restaurant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Nom de l'utilisateur connecté */}
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <UserCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">
                      {me?.username || me?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <p className="text-xs text-orange-600 font-medium">
                      {me?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </p>
                  </div>
                </div>
                <AdminNotificationBell />
              </div>
            </div>
          </header>
          {/* Main Content amélioré */}
          <main className="flex-1 min-h-0 overflow-auto bg-gradient-to-br from-slate-50/50 via-white to-orange-50/20">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
