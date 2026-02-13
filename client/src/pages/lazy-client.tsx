import { lazy, Suspense } from 'react';
import { LoadingFallback } from '@/components/ui/loading-fallback';

// Lazy loading des pages publiques moins critiques (customer pages removed)
export const EventsPage = lazy(() => import('@/pages/EventsPage'));
export const GalleryPage = lazy(() => import('@/pages/GalleryPage'));
export const GalleryAlbumPage = lazy(() => import('@/pages/GalleryAlbumPage'));
export const Contact = lazy(() => import('@/pages/Contact'));
export const LegalPage = lazy(() => import('@/pages/LegalPage'));

// Wrapper HOC pour les pages avec suspense
export function withClientSuspense<T extends object>(Component: React.ComponentType<T>) {
  return function SuspensedComponent(props: T) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Pages publiques avec Suspense intégré
export const EventsPageWithSuspense = withClientSuspense(EventsPage);
export const GalleryPageWithSuspense = withClientSuspense(GalleryPage);
export const GalleryAlbumPageWithSuspense = withClientSuspense(GalleryAlbumPage);
export const ContactWithSuspense = withClientSuspense(Contact);
export const LegalPageWithSuspense = withClientSuspense(LegalPage);