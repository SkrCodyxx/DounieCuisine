import { lazy, Suspense } from 'react';
import { AdminLoadingFallback } from '@/components/ui/loading-fallback';

// Lazy loading des pages admin
export const AdminRedirect = lazy(() => import('@/pages/admin/AdminRedirect'));
export const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
export const Login = lazy(() => import('@/pages/admin/Login'));
export const ChangePassword = lazy(() => import('@/pages/admin/ChangePassword'));
export const CateringMenuAdmin = lazy(() => import('@/pages/admin/CateringMenuAdmin'));
export const CateringQuotesAdmin = lazy(() => import('@/pages/admin/CateringQuotesAdmin'));
export const MenuTakeoutAdmin = lazy(() => import('@/pages/admin/MenuTakeoutAdmin'));
export const CommunityManagement = lazy(() => import('@/pages/admin/CommunityManagement'));
export const Orders = lazy(() => import('@/pages/admin/Orders'));
export const Events = lazy(() => import('@/pages/admin/Events'));
export const ContentManagement = lazy(() => import('@/pages/admin/ContentManagement'));
export const SettingsManagement = lazy(() => import('@/pages/admin/SettingsManagement'));
export const SquareTest = lazy(() => import('@/pages/admin/SquareTest'));
export const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
export const Testimonials = lazy(() => import('@/pages/admin/Testimonials'));
export const MessagesUnified = lazy(() => import('@/pages/admin/MessagesUnified'));
export const DeliveryZones = lazy(() => import('@/pages/admin/DeliveryZones'));

// Wrapper HOC pour ajouter automatiquement le Suspense
export function withSuspense<T extends object>(Component: React.ComponentType<T>) {
  return function SuspensedComponent(props: T) {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pages admin avec Suspense intégré
export const AdminRedirectWithSuspense = withSuspense(AdminRedirect);
export const DashboardWithSuspense = withSuspense(Dashboard);
export const LoginWithSuspense = withSuspense(Login);
export const ChangePasswordWithSuspense = withSuspense(ChangePassword);
export const CateringMenuAdminWithSuspense = withSuspense(CateringMenuAdmin);
export const CateringQuotesAdminWithSuspense = withSuspense(CateringQuotesAdmin);
export const MenuTakeoutAdminWithSuspense = withSuspense(MenuTakeoutAdmin);
export const CommunityManagementWithSuspense = withSuspense(CommunityManagement);
export const OrdersWithSuspense = withSuspense(Orders);
export const EventsWithSuspense = withSuspense(Events);
export const ContentManagementWithSuspense = withSuspense(ContentManagement);
export const SettingsManagementWithSuspense = withSuspense(SettingsManagement);
export const SquareTestWithSuspense = withSuspense(SquareTest);
export const UserManagementWithSuspense = withSuspense(UserManagement);
export const TestimonialsWithSuspense = withSuspense(Testimonials);
export const MessagesUnifiedWithSuspense = withSuspense(MessagesUnified);
export const DeliveryZonesWithSuspense = withSuspense(DeliveryZones);