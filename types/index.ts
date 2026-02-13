/**
 * Shared types for Dounie Cuisine
 * Re-exports from schema + custom UI types
 */

export type {
  AdminUser,
  Dish,
  DishVariant,
  DishVariantNew,
  Side,
  DishSide,
  DishCategory,
  Order,
  OrderItem,
  Event,
  EventBooking,
  HeroSlide,
  Gallery,
  GalleryAlbum,
  GalleryPhoto,
  Testimonial,
  ContactMessage,
  Announcement,
  SiteInfo,
  LegalPage,
  TakeoutMenu,
  TakeoutMenuSection,
  TakeoutSectionDish,
  Receipt,
  MenuSchedule,
  ScheduledMenuItem,
  InternalMessage,
  AuditLog,
  SiteBanner,
  PopupAnnouncement,
  PasswordResetToken,
  Message,
  Conversation,
  ConversationMessage,
  MenuSection,
  CateringCategory,
  CateringItem,
  CateringItemPrice,
  CateringMenuItem,
  CateringDecorativeImage,
  Review,
  PromoCode,
  DeliveryZone,
  MediaAsset,
  CateringQuote,
  Notification,
} from "@/lib/schema";

/** Cart item with variant/side selections */
export interface CartItem {
  id: string; // unique cart item id
  dishId: number;
  name: string;
  price: number;
  quantity: number;
  variant?: {
    id: number;
    label: string;
    price: number;
  } | null;
  sides: Array<{
    id: number;
    name: string;
    price: number;
  }>;
  specialRequests?: string;
  imageId?: number | null;
}

/** Gallery image for display */
export interface GalleryImage {
  mediaId: number;
  title: string;
  category: string;
}

/** Nav item */
export interface NavItem {
  label: string;
  href: string;
}
