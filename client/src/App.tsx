import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PWAStatusBar } from "@/components/PWAStatus";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Pages critiques chargées directement (UX prioritaire)
import Home from "@/pages/Home";
import CateringMenu from "@/pages/CateringMenu";
import TakeoutMenu from "@/pages/TakeoutMenu";
import MenuPage from "@/pages/MenuPage";
import Checkout from "@/pages/Checkout";
import OrderTracking from "@/pages/OrderTracking";
import FAQ from "@/pages/FAQ";
import NotFound from "@/pages/NotFound";

// Pages avec lazy loading
import {
  EventsPageWithSuspense as EventsPage,
  GalleryPageWithSuspense as GalleryPage,
  GalleryAlbumPageWithSuspense as GalleryAlbumPage,
  ContactWithSuspense as Contact,
  LegalPageWithSuspense as LegalPage,
} from "@/pages/lazy-client";
// Admin pages avec lazy loading
import {
  AdminRedirectWithSuspense as AdminRedirect,
  DashboardWithSuspense as Dashboard,
  LoginWithSuspense as Login,
  ChangePasswordWithSuspense as ChangePassword,

  CateringMenuAdminWithSuspense as CateringMenuAdmin,
  CateringQuotesAdminWithSuspense as CateringQuotesAdmin,
  MenuTakeoutAdminWithSuspense as MenuTakeoutAdmin,
  CommunityManagementWithSuspense as CommunityManagement,
  OrdersWithSuspense as Orders,
  EventsWithSuspense as Events,
  ContentManagementWithSuspense as ContentManagement,
  SettingsManagementWithSuspense as SettingsManagement,
  SquareTestWithSuspense as SquareTest,
  UserManagementWithSuspense as UserManagement,
  TestimonialsWithSuspense as Testimonials,
  MessagesUnifiedWithSuspense as MessagesUnified,
  DeliveryZonesWithSuspense as DeliveryZones,
} from "@/pages/admin/lazy-admin";

// Wrapper pour les pages admin avec PermissionsProvider
function AdminRoute({ component: Component, ...props }: any) {
  return (
    <PermissionsProvider>
      <Component {...props} />
    </PermissionsProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/menu" component={MenuPage} />
      <Route path="/takeout" component={MenuPage} />
      <Route path="/catering" component={() => <CateringMenu />} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-tracking" component={OrderTracking} />
      <Route path="/events" component={EventsPage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/gallery/:id" component={GalleryAlbumPage} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/legal/:slug" component={LegalPage} />
      <Route path="/square-test" component={() => {
        window.location.href = '/test-square.html';
        return null;
      }} />
      <Route path="/admin" component={(props) => <AdminRoute component={AdminRedirect} {...props} />} />
      <Route path="/admin/dashboard" component={(props) => <AdminRoute component={Dashboard} {...props} />} />
      <Route path="/admin/login" component={(props) => <AdminRoute component={Login} {...props} />} />
      <Route path="/admin/change-password" component={(props) => <AdminRoute component={ChangePassword} {...props} />} />

      <Route path="/admin/catering-menu" component={(props) => <AdminRoute component={CateringMenuAdmin} {...props} />} />
      <Route path="/admin/catering-quotes" component={(props) => <AdminRoute component={CateringQuotesAdmin} {...props} />} />
      <Route path="/admin/takeout-menu" component={(props) => <AdminRoute component={MenuTakeoutAdmin} {...props} />} />
      <Route path="/admin/community" component={(props) => <AdminRoute component={CommunityManagement} {...props} />} />
      <Route path="/admin/orders" component={(props) => <AdminRoute component={Orders} {...props} />} />
      <Route path="/admin/events" component={(props) => <AdminRoute component={Events} {...props} />} />
      <Route path="/admin/content" component={(props) => <AdminRoute component={ContentManagement} {...props} />} />
      <Route path="/admin/settings-management" component={(props) => <AdminRoute component={SettingsManagement} {...props} />} />
      <Route path="/admin/square-test" component={(props) => <AdminRoute component={SquareTest} {...props} />} />
      <Route path="/admin/user-management" component={(props) => <AdminRoute component={UserManagement} {...props} />} />
      <Route path="/admin/testimonials" component={(props) => <AdminRoute component={Testimonials} {...props} />} />
      <Route path="/admin/messages" component={(props) => <AdminRoute component={MessagesUnified} {...props} />} />
      <Route path="/admin/delivery-zones" component={(props) => <AdminRoute component={DeliveryZones} {...props} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <TooltipProvider>
            <div className="min-h-full flex flex-col">
              <PWAStatusBar />
              <ScrollToTop />
              <Toaster />
              <Router />
            </div>
          </TooltipProvider>
        </CartProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
