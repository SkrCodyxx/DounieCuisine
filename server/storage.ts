import { db } from "./db";
import { eq, and, desc, asc, sql, inArray, isNotNull, like, or } from "drizzle-orm";
import * as schema from "../shared/schema";
import type {
  Dish, InsertDish,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  Event, InsertEvent,
  EventBooking, InsertEventBooking,
  HeroSlide, InsertHeroSlide,
  Gallery, InsertGallery,
  GalleryPhoto, InsertGalleryPhoto,
  Testimonial, InsertTestimonial,
  ContactMessage, InsertContactMessage,
  Announcement, InsertAnnouncement,
  SiteInfo, InsertSiteInfo,
  AdminUser, InsertAdminUser,
  // Customer imports removed - no more customer accounts
  LegalPage, InsertLegalPage,
  Message, InsertMessage,
  Conversation, InsertConversation,
  ConversationMessage, InsertConversationMessage,
  MenuSection, InsertMenuSection,
  CateringMenuItem, InsertCateringMenuItem,
  CateringDecorativeImage, InsertCateringDecorativeImage,
  CateringCategory, InsertCateringCategory,
  CateringItem, InsertCateringItem,
  CateringItemPrice, InsertCateringItemPrice,
  TakeoutMenu, InsertTakeoutMenu,
  TakeoutMenuSection, InsertTakeoutMenuSection,
  TakeoutSectionDish, InsertTakeoutSectionDish,
  MediaAsset, InsertMediaAsset,
  DishCategory, InsertDishCategory,
  DishVariantNew, InsertDishVariant,
  Side, InsertSide,
  DishSide, InsertDishSide
} from "../shared/schema";

export interface DishWithVariants extends Dish {
  variants?: schema.DishVariant[];
}

export interface IStorage {
  // Dishes
  getDishes(isTakeout?: boolean): Promise<Dish[]>;
  getDishesWithVariants(isTakeout?: boolean): Promise<DishWithVariants[]>;
  getDish(id: number): Promise<Dish | undefined>;
  createDish(dish: InsertDish): Promise<Dish>;
  updateDish(id: number, dish: Partial<InsertDish>): Promise<Dish | undefined>;
  deleteDish(id: number): Promise<boolean>;

  // Dish Variants
  // Les variantes sont maintenant gérées directement dans la table dishes avec priceSmall/priceLarge

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  getAllOrders(): Promise<any[]>; // Orders with customer and items
  getOrderById(id: number): Promise<any | undefined>; // Order with customer and items
  updateOrderStatus(id: number, status: string): Promise<boolean>;

  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Event Bookings
  getEventBookings(eventId?: number): Promise<EventBooking[]>;
  createEventBooking(booking: InsertEventBooking): Promise<EventBooking>;

  // Hero Slides
  getHeroSlides(): Promise<HeroSlide[]>;
  getAllHeroSlides(): Promise<HeroSlide[]>;
  getHeroSlide(id: number): Promise<HeroSlide | undefined>;
  createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide>;
  updateHeroSlide(id: number, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined>;
  deleteHeroSlide(id: number): Promise<boolean>;

  // Gallery
  getGalleryItems(category?: string): Promise<Gallery[]>;
  getGalleryItem(id: number): Promise<Gallery | undefined>;
  getGalleryCategories(): Promise<string[]>;
  createGalleryItem(item: InsertGallery): Promise<Gallery>;
  updateGalleryItem(id: number, item: Partial<InsertGallery>): Promise<Gallery | undefined>;
  deleteGalleryItem(id: number): Promise<boolean>;

  // Testimonials
  getTestimonials(approvedOnly?: boolean): Promise<Testimonial[]>;
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: number, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: number): Promise<boolean>;

  // Contact Messages
  getContactMessages(): Promise<ContactMessage[]>;
  getContactMessage(id: number): Promise<ContactMessage | undefined>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessage(id: number, message: Partial<InsertContactMessage>): Promise<ContactMessage | undefined>;
  deleteContactMessage(id: number): Promise<boolean>;

  // Announcements
  getAnnouncements(activeOnly?: boolean): Promise<Announcement[]>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  getAnnouncementBySlug(slug: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;

  // Site Info
  getSiteInfo(): Promise<SiteInfo | undefined>;
  updateSiteInfo(data: Partial<InsertSiteInfo>): Promise<SiteInfo>;
  
  // Square Payment Settings
  getSquareSettings(): Promise<{
    square_application_id: string;
    square_access_token: string; // Masked with **** for security
    square_location_id: string;
    square_environment: string;
  }>;
  updateSquareSettings(settings: {
    square_application_id?: string;
    square_access_token?: string;
    square_location_id?: string;
    square_environment?: string;
  }): Promise<void>;
  getSquareAccessToken(): Promise<string>; // Get unmasked token for internal use



  // Admin Users
  getAdminUsers(): Promise<AdminUser[]>;
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  getFirstActiveAdmin(): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: number, user: Partial<InsertAdminUser>): Promise<AdminUser | undefined>;
  deleteAdminUser(id: number): Promise<boolean>;
  toggleAdminUserStatus(id: number): Promise<AdminUser | undefined>;

  // Customer methods removed - no more customer accounts
  // Customer data is now stored directly in orders via checkout forms

  // Note: Email Templates methods removed - now using Mailjet
  // Note: Daily Menu Schedule methods removed - replaced by new takeout menu system

  // Legal Pages
  getLegalPages(activeOnly?: boolean): Promise<LegalPage[]>;
  getLegalPage(id: number): Promise<LegalPage | undefined>;
  getLegalPageBySlug(slug: string): Promise<LegalPage | undefined>;
  createLegalPage(page: InsertLegalPage): Promise<LegalPage>;
  updateLegalPage(id: number, page: Partial<InsertLegalPage>): Promise<LegalPage | undefined>;
  deleteLegalPage(id: number): Promise<boolean>;

  // Note: Daily Menu Items methods removed - replaced by new takeout menu system

  // Password Reset Tokens
  createPasswordResetToken(token: schema.InsertPasswordResetToken): Promise<schema.PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<schema.PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;

  // Messages (Internal Messaging)
  getConversations(userType: string, userId: number): Promise<Array<{
    conversationId: string;
    otherPartyId: number;
    otherPartyName: string;
    lastMessage: string;
    lastMessageAt: Date;
    unreadCount: number;
  }>>;
  getMessages(conversationId: string): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  markConversationAsRead(conversationId: string, recipientId: number): Promise<void>;
  deleteMessage(id: number): Promise<boolean>;

  // Customer-Admin Conversations (New System)
  // Storage interface simplified - customers now defined by their orders
  getAdminConversations(status?: 'open' | 'closed'): Promise<Array<Conversation & { customerName: string; customerEmail: string }>>;
  getConversationById(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<boolean>;
  closeConversation(id: number, adminId: number): Promise<void>;
  reopenConversation(id: number, customerId?: number): Promise<boolean>;
  updateConversationUnreadCounts(conversationId: number, incrementCustomer?: boolean, incrementAdmin?: boolean): Promise<void>;
  markConversationReadByCustomer(conversationId: number): Promise<void>;
  markConversationReadByAdmin(conversationId: number): Promise<void>;
  
  // Conversation Messages
  getConversationMessages(conversationId: number): Promise<Array<ConversationMessage & { adminUsername?: string }>>;
  createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage>;
  markConversationAsReadByCustomer(conversationId: number): Promise<void>;
  markConversationAsReadByAdmin(conversationId: number): Promise<void>;

  // Dashboard Statistics
  getDashboardStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalMessages: number;
    totalConversations: number;
    activeConversations: number;
    unreadMessages: number;
    ordersGrowth: number;
    revenueGrowth: number;
    messagesGrowth: number;
    conversationsGrowth: number;
  }>;
  getRecentActivity(): Promise<Array<{
    id: string;
    type: 'order' | 'message' | 'conversation' | 'customer' | 'event';
    title: string;
    description: string;
    timestamp: Date;
    entityId?: number;
    link?: string;
  }>>;

  // Menu Sections
  getMenuSections(activeOnly?: boolean): Promise<MenuSection[]>;
  getMenuSection(id: number): Promise<MenuSection | undefined>;
  createMenuSection(section: InsertMenuSection): Promise<MenuSection>;
  updateMenuSection(id: number, section: Partial<InsertMenuSection>): Promise<MenuSection | undefined>;
  deleteMenuSection(id: number): Promise<boolean>;

  // CATERING DECORATIVE IMAGES
  getCateringDecorativeImages(activeOnly?: boolean): Promise<CateringDecorativeImage[]>;
  getCateringDecorativeImage(id: number): Promise<CateringDecorativeImage | undefined>;
  createCateringDecorativeImage(image: InsertCateringDecorativeImage): Promise<CateringDecorativeImage>;
  updateCateringDecorativeImage(id: number, image: Partial<InsertCateringDecorativeImage>): Promise<CateringDecorativeImage | undefined>;
  deleteCateringDecorativeImage(id: number): Promise<boolean>;
  // NEW FLEXIBLE CATERING SYSTEM
  // Catering Categories
  getCateringCategories(activeOnly?: boolean): Promise<CateringCategory[]>;
  getCateringCategory(id: number): Promise<CateringCategory | undefined>;
  createCateringCategory(category: InsertCateringCategory): Promise<CateringCategory>;
  updateCateringCategory(id: number, category: Partial<InsertCateringCategory>): Promise<CateringCategory | undefined>;
  deleteCateringCategory(id: number): Promise<boolean>;
  reorderCateringCategories(categoryOrders: { id: number; displayOrder: number }[]): Promise<boolean>;

  // Catering Items
  getCateringItems(categoryId?: number, activeOnly?: boolean): Promise<CateringItem[]>;
  getCateringItem(id: number): Promise<CateringItem | undefined>;
  createCateringItem(item: InsertCateringItem): Promise<CateringItem>;
  updateCateringItem(id: number, item: Partial<InsertCateringItem>): Promise<CateringItem | undefined>;
  deleteCateringItem(id: number): Promise<boolean>;

  // Catering Item Prices - Overloaded method signatures
  getCateringItemPrices(): Promise<CateringItemPrice[]>;
  getCateringItemPrices(itemId: number): Promise<CateringItemPrice[]>;
  getCateringItemPrice(id: number): Promise<CateringItemPrice | undefined>;
  createCateringItemPrice(price: InsertCateringItemPrice): Promise<CateringItemPrice>;
  updateCateringItemPrice(id: number, price: Partial<InsertCateringItemPrice>): Promise<CateringItemPrice | undefined>;
  deleteCateringItemPrice(id: number): Promise<boolean>;

  // Complete Catering Menu with Categories, Items and Prices
  getCompleteCateringMenu(): Promise<(CateringCategory & { 
    items: (CateringItem & { prices: CateringItemPrice[] })[] 
  })[]>;

  // CATERING QUOTES
  getCateringQuotes(): Promise<schema.CateringQuote[]>;
  getCateringQuote(id: number): Promise<schema.CateringQuote | undefined>;
  createCateringQuote(quote: schema.InsertCateringQuote): Promise<schema.CateringQuote>;
  updateCateringQuote(id: number, quote: Partial<schema.InsertCateringQuote>): Promise<schema.CateringQuote | undefined>;
  deleteCateringQuote(id: number): Promise<boolean>;

  // REVIEWS
  getReviews(): Promise<schema.Review[]>;
  getReview(id: number): Promise<schema.Review | undefined>;
  createReview(review: schema.InsertReview): Promise<schema.Review>;
  updateReview(id: number, review: Partial<schema.InsertReview>): Promise<schema.Review | undefined>;
  deleteReview(id: number): Promise<boolean>;

  // PROMO CODES
  getPromoCodes(activeOnly?: boolean): Promise<schema.PromoCode[]>;
  getPromoCode(id: number): Promise<schema.PromoCode | undefined>;
  getPromoCodeByCode(code: string): Promise<schema.PromoCode | undefined>;
  createPromoCode(promoCode: schema.InsertPromoCode): Promise<schema.PromoCode>;
  updatePromoCode(id: number, promoCode: Partial<schema.InsertPromoCode>): Promise<schema.PromoCode | undefined>;
  deletePromoCode(id: number): Promise<boolean>;

  // Note: Weekly Menus, Menu Day Assignments, and Menu Dishes methods removed - replaced by new takeout menu system

  // Delivery Zones
  getDeliveryZones(): Promise<schema.DeliveryZone[]>;
  getDeliveryZone(id: number): Promise<schema.DeliveryZone | undefined>;
  createDeliveryZone(zone: schema.InsertDeliveryZone): Promise<schema.DeliveryZone>;
  updateDeliveryZone(id: number, zone: Partial<schema.InsertDeliveryZone>): Promise<schema.DeliveryZone | undefined>;
  deleteDeliveryZone(id: number): Promise<boolean>;
  getDeliveryPriceForDistance(distanceKm: number): Promise<number | null>;

  // Takeout Menus
  getTakeoutMenus(): Promise<TakeoutMenu[]>;
  getActiveTakeoutMenu(): Promise<TakeoutMenu | undefined>;
  getTakeoutMenu(id: number): Promise<TakeoutMenu | undefined>;
  createTakeoutMenu(menu: InsertTakeoutMenu): Promise<TakeoutMenu>;
  updateTakeoutMenu(id: number, menu: Partial<InsertTakeoutMenu>): Promise<TakeoutMenu | undefined>;
  deleteTakeoutMenu(id: number): Promise<boolean>;
  setActiveTakeoutMenu(id: number): Promise<void>;
  setTakeoutMenuStatus(id: number, isActive: boolean): Promise<void>;

  // Takeout Menu Sections
  getTakeoutMenuSections(menuId: number): Promise<TakeoutMenuSection[]>;
  getTakeoutMenuSection(id: number): Promise<TakeoutMenuSection | undefined>;
  createTakeoutMenuSection(section: InsertTakeoutMenuSection): Promise<TakeoutMenuSection>;
  updateTakeoutMenuSection(id: number, section: Partial<InsertTakeoutMenuSection>): Promise<TakeoutMenuSection | undefined>;
  deleteTakeoutMenuSection(id: number): Promise<boolean>;
  reorderTakeoutMenuSections(menuId: number, sectionOrders: Array<{ id: number; displayOrder: number }>): Promise<void>;

  // Takeout Section Dishes
  getTakeoutSectionDishes(sectionId: number): Promise<Array<TakeoutSectionDish & { dish: Dish }>>;
  createTakeoutSectionDish(assignment: InsertTakeoutSectionDish): Promise<TakeoutSectionDish>;
  deleteTakeoutSectionDish(id: number): Promise<boolean>;
  reorderTakeoutSectionDishes(sectionId: number, dishOrders: Array<{ id: number; displayOrder: number }>): Promise<void>;

  // Media Assets
  getMediaAsset(id: number): Promise<MediaAsset | undefined>;
  createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset>;
  deleteMediaAsset(id: number): Promise<boolean>;

  // Dish Categories (NEW)
  getAllCategories(): Promise<DishCategory[]>;
  createCategory(category: InsertDishCategory): Promise<DishCategory>;
  updateCategory(id: number, category: Partial<InsertDishCategory>): Promise<DishCategory | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Dish Variants (NEW)
  getAllVariants(): Promise<DishVariantNew[]>;
  getDishVariants(dishId: number): Promise<DishVariantNew[]>;
  createVariant(variant: InsertDishVariant): Promise<DishVariantNew>;
  updateVariant(id: number, variant: Partial<InsertDishVariant>): Promise<DishVariantNew | undefined>;
  deleteVariant(id: number): Promise<boolean>;

  // Sides/Accompagnements - Returns sides dishes
  getSides(): Promise<schema.Side[]>;

  // Gallery Photos (NEW)
  getGalleryPhotos(albumId?: number): Promise<GalleryPhoto[]>;
  createGalleryPhoto(photo: InsertGalleryPhoto): Promise<GalleryPhoto>;
  updateGalleryPhoto(id: number, photo: Partial<InsertGalleryPhoto>): Promise<GalleryPhoto | undefined>;

  // SIDES - SUPPRIMÉES (Table inexistante dans le schéma)

  // ========================================
  // MÉTHODES MANQUANTES POUR SYNCHRONISATION 100%
  // ========================================
  
  // CATERING QUOTES
  getCateringQuotes(): Promise<schema.CateringQuote[]>;
  getCateringQuote(id: number): Promise<schema.CateringQuote | undefined>;
  createCateringQuote(quote: schema.InsertCateringQuote): Promise<schema.CateringQuote>;
  updateCateringQuote(id: number, quote: Partial<schema.InsertCateringQuote>): Promise<schema.CateringQuote | undefined>;
  deleteCateringQuote(id: number): Promise<boolean>;

  // REVIEWS
  getReviews(): Promise<schema.Review[]>;
  getReview(id: number): Promise<schema.Review | undefined>;
  createReview(review: schema.InsertReview): Promise<schema.Review>;
  updateReview(id: number, review: Partial<schema.InsertReview>): Promise<schema.Review | undefined>;
  deleteReview(id: number): Promise<boolean>;

  // PROMO CODES  
  getPromoCodes(activeOnly?: boolean): Promise<schema.PromoCode[]>;
  getPromoCode(id: number): Promise<schema.PromoCode | undefined>;
  getPromoCodeByCode(code: string): Promise<schema.PromoCode | undefined>;
  createPromoCode(promoCode: schema.InsertPromoCode): Promise<schema.PromoCode>;
  updatePromoCode(id: number, promoCode: Partial<schema.InsertPromoCode>): Promise<schema.PromoCode | undefined>;
  deletePromoCode(id: number): Promise<boolean>;

  // RECEIPTS
  getReceipts(): Promise<schema.Receipt[]>;
  getReceiptByOrderId(orderId: number): Promise<schema.Receipt | undefined>;
  createReceipt(receipt: schema.InsertReceipt): Promise<schema.Receipt>;

  // ADMIN MODULE PERMISSIONS  
  getAdminModules(): Promise<schema.AdminModule[]>;
  getAdminModulePermissions(adminUserId: number): Promise<schema.AdminModulePermission[]>;
  createAdminModulePermission(permission: schema.InsertAdminModulePermission): Promise<schema.AdminModulePermission>;
  updateAdminModulePermission(id: number, permission: Partial<schema.InsertAdminModulePermission>): Promise<schema.AdminModulePermission | undefined>;
}

export class MySQLStorage implements IStorage {
  // Dishes
  async getDishes(isTakeout?: boolean): Promise<Dish[]> {
    if (isTakeout !== undefined) {
      return await db.select().from(schema.dishes)
        .where(eq(schema.dishes.isTakeout, isTakeout ? 1 : 0))
        .orderBy(asc(schema.dishes.displayOrder));
    }
    return await db.select().from(schema.dishes)
      .orderBy(asc(schema.dishes.displayOrder));
  }

  async getDishesWithVariants(isTakeout?: boolean): Promise<DishWithVariants[]> {
    const dishes = await this.getDishes(isTakeout);

    // Récupérer toutes les variantes réelles depuis la nouvelle table flexible (seulement les actives)
    const dishIds = dishes.map(d => d.id);
    let allVariants: schema.DishVariantNew[] = [];
    if (dishIds.length > 0) {
      allVariants = await db.select().from(schema.dishVariantsNew)
        .where(and(
          inArray(schema.dishVariantsNew.dishId, dishIds),
          eq(schema.dishVariantsNew.isActive, 1)
        ))
        .orderBy(schema.dishVariantsNew.displayOrder, schema.dishVariantsNew.id);
    }

    return dishes.map(dish => ({
      ...dish,
      variants: allVariants
        .filter(v => v.dishId === dish.id)
        .map(v => ({
          id: v.id,
          dishId: v.dishId,
          label: v.label,
          // Normaliser le prix (Drizzle numeric peut revenir string). On convertit tout en string si possible.
          price: (() => { const raw = (v as any).price; return raw == null ? '0' : (typeof raw === 'string' ? raw : String(raw)); })(),
          displayOrder: v.displayOrder,
          isDefault: v.isDefault,
          isActive: v.isActive,
          // Convertir Date en ISO string si nécessaire pour correspondre au type attendu
          createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : (v.createdAt as any),
          updatedAt: v.updatedAt instanceof Date ? v.updatedAt.toISOString() : (v.updatedAt as any)
        }))
    }));
  }

  async getDish(id: number): Promise<Dish | undefined> {
    const results = await db.select().from(schema.dishes)
      .where(eq(schema.dishes.id, id))
      .limit(1);
    return results[0];
  }

  async createDish(dish: InsertDish): Promise<Dish> {
    const result = await db.insert(schema.dishes).values(dish).returning();
    if (result.length === 0) {
      throw new Error("Failed to create dish");
    }
    return result[0];
  }

  async updateDish(id: number, dish: Partial<InsertDish>): Promise<Dish | undefined> {
    await db.update(schema.dishes)
      .set(dish)
      .where(eq(schema.dishes.id, id));
    
    return await this.getDish(id);
  }

  async deleteDish(id: number): Promise<boolean> {
    await db.delete(schema.dishes).where(eq(schema.dishes.id, id));
    return true;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      return await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const results = await db.select().from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    return results[0];
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const results = await db.select().from(schema.orders)
      .where(eq(schema.orders.orderNumber, orderNumber))
      .limit(1);
    return results[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(schema.orders).values(order).returning();
    const id = result[0].id;
    const created = await this.getOrder(id);
    if (!created) throw new Error("Failed to create order");
    return created;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    await db.update(schema.orders)
      .set(order)
      .where(eq(schema.orders.id, id));
    return await this.getOrder(id);
  }

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<boolean> {
    try {
      await db.update(schema.orders)
        .set({
          status,
          ...(notes && { notes }),
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(schema.orders.id, id));
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  async updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<boolean> {
    try {
      await db.update(schema.orders)
        .set({
          paymentStatus,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(schema.orders.id, id));
      return true;
    } catch (error) {
      console.error('Error updating order payment status:', error);
      return false;
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      // Delete order items first (foreign key constraint)
      await db.delete(schema.orderItems)
        .where(eq(schema.orderItems.orderId, id));

      // Delete the order
      await db.delete(schema.orders)
        .where(eq(schema.orders.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  async getOrdersStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
  }> {
    try {
      const [totalResult, pendingResult, completedResult, revenueResult] = await Promise.all([
        db.select({ count: sql`count(*)` }).from(schema.orders),
        db.select({ count: sql`count(*)` }).from(schema.orders).where(eq(schema.orders.status, 'pending')),
        db.select({ count: sql`count(*)` }).from(schema.orders).where(eq(schema.orders.status, 'delivered')),
        db.select({ sum: sql`sum(total_amount)` }).from(schema.orders).where(eq(schema.orders.paymentStatus, 'completed'))
      ]);

      return {
        totalOrders: Number(totalResult[0]?.count || 0),
        pendingOrders: Number(pendingResult[0]?.count || 0),
        completedOrders: Number(completedResult[0]?.count || 0),
        totalRevenue: Number(revenueResult[0]?.sum || 0)
      };
    } catch (error) {
      console.error('Error getting orders stats:', error);
      return {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0
      };
    }
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<any[]> {
    return await db.select({
      id: schema.orderItems.id,
      orderId: schema.orderItems.orderId,
      dishId: schema.orderItems.dishId,
      quantity: schema.orderItems.quantity,
      unitPrice: schema.orderItems.unitPrice,
      specialRequests: schema.orderItems.specialRequests,
      dishName: schema.dishes.name,
    })
    .from(schema.orderItems)
    .leftJoin(schema.dishes, eq(schema.orderItems.dishId, schema.dishes.id))
    .where(eq(schema.orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(schema.orderItems).values(item).returning();
    const id = result[0].id;
    const results = await db.select().from(schema.orderItems)
      .where(eq(schema.orderItems.id, id))
      .limit(1);
    if (!results[0]) throw new Error("Failed to create order item");
    return results[0];
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    if (items.length === 0) return [];
    await db.insert(schema.orderItems).values(items);
    return await this.getOrderItems(items[0].orderId);
  }

  // Admin Orders with customer and items
  async getAllOrders(): Promise<any[]> {
    const orders = await db.select({
      id: schema.orders.id,
      orderNumber: schema.orders.orderNumber,
      status: schema.orders.status,
      totalAmount: schema.orders.totalAmount,
      taxAmount: schema.orders.taxAmount,
      deliveryFee: schema.orders.deliveryFee,
      orderType: schema.orders.orderType,
      deliveryAddress: schema.orders.deliveryAddress,
      deliveryApartment: schema.orders.deliveryApartment,
      deliveryTime: schema.orders.deliveryTime,
      specialInstructions: schema.orders.specialInstructions,
      createdAt: schema.orders.createdAt,
      paymentMethod: schema.orders.paymentMethod,
      customerName: schema.orders.customerName,
      customerEmail: schema.orders.customerEmail,
      customerPhone: schema.orders.customerPhone
    })
    .from(schema.orders)
    .orderBy(desc(schema.orders.createdAt));

    // Get order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await this.getOrderItems(order.id);
      return {
        ...order,
        items
      };
    }));

    return ordersWithItems;
  }

  async getOrderById(id: number): Promise<any | undefined> {
    const orderResults = await db.select({
      id: schema.orders.id,
      orderNumber: schema.orders.orderNumber,
      status: schema.orders.status,
      totalAmount: schema.orders.totalAmount,
      taxAmount: schema.orders.taxAmount,
      deliveryFee: schema.orders.deliveryFee,
      orderType: schema.orders.orderType,
      deliveryAddress: schema.orders.deliveryAddress,
      deliveryApartment: schema.orders.deliveryApartment,
      deliveryTime: schema.orders.deliveryTime,
      specialInstructions: schema.orders.specialInstructions,
      createdAt: schema.orders.createdAt,
      paymentMethod: schema.orders.paymentMethod,
      customerName: schema.orders.customerName,
      customerEmail: schema.orders.customerEmail,
      customerPhone: schema.orders.customerPhone
    })
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);

    if (!orderResults[0]) return undefined;

    const order = orderResults[0];
    const items = await this.getOrderItems(order.id);
    
    return {
      ...order,
      items
    };
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return await db.select().from(schema.events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const results = await db.select().from(schema.events)
      .where(eq(schema.events.id, id))
      .limit(1);
    return results[0];
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    const results = await db.select().from(schema.events)
      .where(eq(schema.events.slug, slug))
      .limit(1);
    return results[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(schema.events).values(event).returning();
    const id = result[0].id;
    const created = await this.getEvent(id);
    if (!created) throw new Error("Failed to create event");
    return created;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    await db.update(schema.events)
      .set(event)
      .where(eq(schema.events.id, id));
    return await this.getEvent(id);
  }

  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(schema.events).where(eq(schema.events.id, id));
    return true;
  }

  // Event Bookings
  async getEventBookings(eventId?: number): Promise<EventBooking[]> {
    if (eventId !== undefined) {
      return await db.select().from(schema.eventBookings)
        .where(eq(schema.eventBookings.eventId, eventId))
        .orderBy(desc(schema.eventBookings.createdAt));
    }
    return await db.select().from(schema.eventBookings)
      .orderBy(desc(schema.eventBookings.createdAt));
  }

  async createEventBooking(booking: InsertEventBooking): Promise<EventBooking> {
    const result = await db.insert(schema.eventBookings).values(booking).returning();
    const id = result[0].id;
    const results = await db.select().from(schema.eventBookings)
      .where(eq(schema.eventBookings.id, id))
      .limit(1);
    if (!results[0]) throw new Error("Failed to create event booking");
    return results[0];
  }

  // Hero Slides
  async getHeroSlides(): Promise<HeroSlide[]> {
    return await db.select().from(schema.heroSlides)
      .where(eq(schema.heroSlides.active, 1))
      .orderBy(asc(schema.heroSlides.displayOrder));
  }

  async getAllHeroSlides(): Promise<HeroSlide[]> {
    return await db.select().from(schema.heroSlides)
      .orderBy(asc(schema.heroSlides.displayOrder));
  }

  async getHeroSlide(id: number): Promise<HeroSlide | undefined> {
    const results = await db.select().from(schema.heroSlides)
      .where(eq(schema.heroSlides.id, id))
      .limit(1);
    return results[0];
  }

  async createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide> {
    const result = await db.insert(schema.heroSlides).values(slide).returning();
    const id = result[0].id;
    const created = await this.getHeroSlide(id);
    if (!created) throw new Error("Failed to create hero slide");
    return created;
  }

  async updateHeroSlide(id: number, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined> {
    // Convertir undefined en null pour logoId
    const updateData = { ...slide };
    if ('logoId' in updateData && updateData.logoId === undefined) {
      updateData.logoId = null;
    }
    
    await db.update(schema.heroSlides)
      .set(updateData)
      .where(eq(schema.heroSlides.id, id));
    return await this.getHeroSlide(id);
  }

  async deleteHeroSlide(id: number): Promise<boolean> {
    // First, get the slide to check if it has an associated image
    const slide = await this.getHeroSlide(id);
    
    // Delete the slide
    await db.delete(schema.heroSlides).where(eq(schema.heroSlides.id, id));
    
    // If the slide had an associated media asset, delete it too
    if (slide && slide.mediaId) {
      await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, slide.mediaId));
    }
    
    return true;
  }

  // Gallery
  async getGalleryItems(category?: string): Promise<Gallery[]> {
    if (category) {
      return await db.select().from(schema.gallery)
        .where(and(
          eq(schema.gallery.category, category),
          eq(schema.gallery.active, 1)
        ))
        .orderBy(asc(schema.gallery.displayOrder));
    }
    return await db.select().from(schema.gallery)
      .where(eq(schema.gallery.active, 1))
      .orderBy(asc(schema.gallery.displayOrder));
  }

  async getGalleryItem(id: number): Promise<Gallery | undefined> {
    const results = await db.select().from(schema.gallery)
      .where(eq(schema.gallery.id, id))
      .limit(1);
    return results[0];
  }

  async getGalleryCategories(): Promise<string[]> {
    const results = await db.selectDistinct({ category: schema.gallery.category })
      .from(schema.gallery)
      .where(isNotNull(schema.gallery.category))
      .orderBy(asc(schema.gallery.category));
    return results.map(r => r.category).filter((cat): cat is string => cat !== null);
  }

  async createGalleryItem(item: InsertGallery): Promise<Gallery> {
    const result = await db.insert(schema.gallery).values(item).returning();
    const id = result[0].id;
    const created = await this.getGalleryItem(id);
    if (!created) throw new Error("Failed to create gallery item");
    return created;
  }

  async updateGalleryItem(id: number, item: Partial<InsertGallery>): Promise<Gallery | undefined> {
    await db.update(schema.gallery)
      .set(item)
      .where(eq(schema.gallery.id, id));
    return await this.getGalleryItem(id);
  }

  async deleteGalleryItem(id: number): Promise<boolean> {
  // Récupérer l'item avant suppression pour connaître les médias liés
  const item = await this.getGalleryItem(id);
  if (!item) {
    return false;
  }

  await db.delete(schema.gallery).where(eq(schema.gallery.id, id));

  // Vérifier si le média principal est encore référencé ailleurs
  if (item.mediaId) {
    const refs = await db.execute(sql`SELECT 1 FROM hero_slides WHERE media_id = ${item.mediaId} LIMIT 1`);
    const refs2 = await db.execute(sql`SELECT 1 FROM hero_slides WHERE logo_id = ${item.mediaId} LIMIT 1`);
    const refs3 = await db.execute(sql`SELECT 1 FROM events WHERE image_id = ${item.mediaId} LIMIT 1`);
    const refs4 = await db.execute(sql`SELECT 1 FROM dishes WHERE image_id = ${item.mediaId} LIMIT 1`);
    const refs5 = await db.execute(sql`SELECT 1 FROM testimonials WHERE client_photo_id = ${item.mediaId} LIMIT 1`);
    const refs6 = await db.execute(sql`SELECT 1 FROM site_info WHERE logo_id = ${item.mediaId} LIMIT 1`);
    const refsGallery = await db.execute(sql`SELECT 1 FROM gallery WHERE media_id = ${item.mediaId} LIMIT 1`);
    if (refs.rows.length === 0 && refs2.rows.length === 0 && refs3.rows.length === 0 && refs4.rows.length === 0 && refs5.rows.length === 0 && refs6.rows.length === 0 && refsGallery.rows.length === 0) {
      await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, item.mediaId));
    }
  }

  // Idem pour la miniature
  if (item.thumbnailId) {
    const thumbRefs = await db.execute(sql`SELECT 1 FROM gallery WHERE thumbnail_id = ${item.thumbnailId} LIMIT 1`);
    if (thumbRefs.rows.length === 0) {
      await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, item.thumbnailId));
    }
  }

  return true;
  }

  // Testimonials
  async getTestimonials(approvedOnly = false): Promise<Testimonial[]> {
    if (approvedOnly) {
      return await db.select().from(schema.testimonials)
        .where(eq(schema.testimonials.approved, 1))
        .orderBy(asc(schema.testimonials.displayOrder));
    }
    return await db.select().from(schema.testimonials)
      .orderBy(asc(schema.testimonials.displayOrder));
  }

  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    const results = await db.select().from(schema.testimonials)
      .where(eq(schema.testimonials.id, id))
      .limit(1);
    return results[0];
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const result = await db.insert(schema.testimonials).values(testimonial).returning();
    const id = result[0].id;
    const created = await this.getTestimonial(id);
    if (!created) throw new Error("Failed to create testimonial");
    return created;
  }

  async updateTestimonial(id: number, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    await db.update(schema.testimonials)
      .set(testimonial)
      .where(eq(schema.testimonials.id, id));
    return await this.getTestimonial(id);
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    await db.delete(schema.testimonials).where(eq(schema.testimonials.id, id));
    return true;
  }

  // Contact Messages
  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(schema.contactMessages)
      .orderBy(desc(schema.contactMessages.createdAt));
  }

  async getContactMessage(id: number): Promise<ContactMessage | undefined> {
    const results = await db.select().from(schema.contactMessages)
      .where(eq(schema.contactMessages.id, id))
      .limit(1);
    return results[0];
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const result = await db.insert(schema.contactMessages).values(message).returning();
    const id = result[0].id;
    const created = await this.getContactMessage(id);
    if (!created) throw new Error("Failed to create contact message");
    return created;
  }

  async updateContactMessage(id: number, message: Partial<InsertContactMessage>): Promise<ContactMessage | undefined> {
    await db.update(schema.contactMessages)
      .set(message)
      .where(eq(schema.contactMessages.id, id));
    return await this.getContactMessage(id);
  }

  async deleteContactMessage(id: number): Promise<boolean> {
    const result = await db.delete(schema.contactMessages)
      .where(eq(schema.contactMessages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Announcements
  async getAnnouncements(activeOnly = false): Promise<Announcement[]> {
    if (activeOnly) {
      return await db.select().from(schema.announcements)
        .where(eq(schema.announcements.active, 1))
        .orderBy(desc(schema.announcements.createdAt));
    }
    return await db.select().from(schema.announcements)
      .orderBy(desc(schema.announcements.createdAt));
  }

  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const results = await db.select().from(schema.announcements)
      .where(eq(schema.announcements.id, id))
      .limit(1);
    return results[0];
  }

  async getAnnouncementBySlug(slug: string): Promise<Announcement | undefined> {
    const results = await db.select().from(schema.announcements)
      .where(eq(schema.announcements.slug, slug))
      .limit(1);
    return results[0];
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const result = await db.insert(schema.announcements).values(announcement).returning();
    const id = result[0].id;
    const created = await this.getAnnouncement(id);
    if (!created) throw new Error("Failed to create announcement");
    return created;
  }

  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    await db.update(schema.announcements)
      .set(announcement)
      .where(eq(schema.announcements.id, id));
    return await this.getAnnouncement(id);
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    await db.delete(schema.announcements).where(eq(schema.announcements.id, id));
    return true;
  }

  // Site Info
  async getSiteInfo(): Promise<SiteInfo | undefined> {
    // Use raw SQL to get ALL columns including social media fields
    const result = await db.execute(sql`
      SELECT id, business_name, company_name, tagline, description, 
             phone1, phone1_label, phone2, phone2_label, phone3, phone3_label,
             whatsapp_number, email_primary, email_secondary, email_support,
             address, city, province, postal_code, country, business_hours, 
             tps_rate, tvq_rate, delivery_radius_km, logo_id, logo_visible,
             site_url, admin_url, facebook_url, instagram_url, twitter_url, 
             youtube_url, linkedin_url, meta_title, meta_description, 
             meta_keywords, timezone, maintenance_mode, online_ordering_enabled,
             reservations_enabled, newsletter_enabled, updated_at
      FROM site_info LIMIT 1
    `);
    
    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0] as any;
      return row;
    }
    
    return undefined;
  }

  async updateSiteInfo(data: Partial<InsertSiteInfo>): Promise<SiteInfo> {
    console.log('💾 storage.updateSiteInfo - Received data:', JSON.stringify(data, null, 2));
    
    // Get existing site info
    const existing = await this.getSiteInfo();
    console.log('📋 Existing site info ID:', existing?.id);
    
    if (!existing) {
      // If no site info exists, create it
      console.log('⚠️  No existing site info, creating new entry');
      const result = await db.insert(schema.siteInfo)
        .values({
          businessName: data.businessName || "Dounie Cuisine",
          ...data,
          updatedAt: new Date()
        })
        .returning();
      console.log('✅ Created site info:', result[0]);
      return result[0];
    }
    
    // Update existing site info
    console.log('🔄 Updating site info with ID:', existing.id);
    const updatePayload = {
      ...data,
      updatedAt: new Date()
    };
    console.log('📤 Update payload:', JSON.stringify(updatePayload, null, 2));
    
    await db.update(schema.siteInfo)
      .set(updatePayload)
      .where(eq(schema.siteInfo.id, existing.id));
    
    // Return updated data
    const updated = await this.getSiteInfo();
    if (!updated) throw new Error("Failed to update site info");
    console.log('✅ Site info updated successfully');
    return updated;
  }

  // Square Payment Settings - Maintenant via variables d'environnement pour sécurité
  async getSquareSettings(): Promise<{
    square_application_id: string;
    square_access_token: string;
    square_location_id: string;
    square_environment: string;
  }> {
    return {
      square_application_id: process.env.SQUARE_APPLICATION_ID || '',
      square_access_token: process.env.SQUARE_ACCESS_TOKEN ? '****' + (process.env.SQUARE_ACCESS_TOKEN.slice(-4)) : '',
      square_location_id: process.env.SQUARE_LOCATION_ID || '',
      square_environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
    };
  }

  async updateSquareSettings(settings: {
    square_application_id?: string;
    square_access_token?: string;
    square_location_id?: string;
    square_environment?: string;
  }): Promise<void> {
    // Square settings sont maintenant gérées via variables d'environnement
    // Modification requise directement dans le fichier .env du serveur
    console.log('⚠️  Square settings doivent être configurées dans le fichier .env');
  }

  async getSquareAccessToken(): Promise<string> {
    return process.env.SQUARE_ACCESS_TOKEN || '';
  }

  // Admin Users
  async getAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(schema.adminUsers)
      .orderBy(asc(schema.adminUsers.username));
  }

  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const results = await db.select().from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, id))
      .limit(1);
    return results[0];
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const results = await db.select().from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email))
      .limit(1);
    return results[0];
  }

  async getFirstActiveAdmin(): Promise<AdminUser | undefined> {
    const results = await db.select().from(schema.adminUsers)
      .where(eq(schema.adminUsers.active, 1))
      .limit(1);
    return results[0];
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const result = await db.insert(schema.adminUsers).values(user).returning();
    const id = result[0].id;
    const created = await this.getAdminUser(id);
    if (!created) throw new Error("Failed to create admin user");
    return created;
  }

  async updateAdminUser(id: number, user: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    await db.update(schema.adminUsers)
      .set(user)
      .where(eq(schema.adminUsers.id, id));
    return await this.getAdminUser(id);
  }

  async deleteAdminUser(id: number): Promise<boolean> {
    await db.delete(schema.adminUsers)
      .where(eq(schema.adminUsers.id, id));
    return true;
  }

  async toggleAdminUserStatus(id: number): Promise<AdminUser | undefined> {
    const user = await this.getAdminUser(id);
    if (!user) return undefined;
    
    const newStatus = user.active === 1 ? 0 : 1;
    await db.update(schema.adminUsers)
      .set({ active: newStatus, updatedAt: new Date() })
      .where(eq(schema.adminUsers.id, id));
    
    return await this.getAdminUser(id);
  }

  // Note: Daily Menu Schedule and Daily Menu Items methods removed - replaced by new takeout menu system

  // Customers









  // Note: Email Templates implementation removed - now using Mailjet

  // Legal Pages
  async getLegalPages(activeOnly?: boolean): Promise<LegalPage[]> {
    if (activeOnly) {
      return await db.select().from(schema.legalPages)
        .where(eq(schema.legalPages.active, 1))
        .orderBy(asc(schema.legalPages.displayOrder));
    }
    return await db.select().from(schema.legalPages)
      .orderBy(asc(schema.legalPages.displayOrder));
  }

  async getLegalPage(id: number): Promise<LegalPage | undefined> {
    const results = await db.select().from(schema.legalPages)
      .where(eq(schema.legalPages.id, id))
      .limit(1);
    return results[0];
  }

  async getLegalPageBySlug(slug: string): Promise<LegalPage | undefined> {
    const results = await db.select().from(schema.legalPages)
      .where(eq(schema.legalPages.slug, slug))
      .limit(1);
    return results[0];
  }

  async createLegalPage(page: InsertLegalPage): Promise<LegalPage> {
    const result = await db.insert(schema.legalPages).values(page).returning();
    const id = result[0].id;
    const created = await this.getLegalPage(id);
    if (!created) throw new Error("Failed to create legal page");
    return created;
  }

  async updateLegalPage(id: number, page: Partial<InsertLegalPage>): Promise<LegalPage | undefined> {
    await db.update(schema.legalPages)
      .set(page)
      .where(eq(schema.legalPages.id, id));
    return await this.getLegalPage(id);
  }

  async deleteLegalPage(id: number): Promise<boolean> {
    await db.delete(schema.legalPages)
      .where(eq(schema.legalPages.id, id));
    return true;
  }

  // Password Reset Tokens
  async createPasswordResetToken(token: schema.InsertPasswordResetToken): Promise<schema.PasswordResetToken> {
    const result = await db.insert(schema.passwordResetTokens).values(token).returning();
    return result[0];
  }

  async getPasswordResetToken(token: string): Promise<schema.PasswordResetToken | undefined> {
    const now = new Date();
    const results = await db.select().from(schema.passwordResetTokens)
      .where(and(
        eq(schema.passwordResetTokens.token, token),
        eq(schema.passwordResetTokens.used, 0),
        sql`${schema.passwordResetTokens.expiresAt} > ${now}`
      ))
      .limit(1);
    return results[0];
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db.update(schema.passwordResetTokens)
      .set({ used: 1 })
      .where(eq(schema.passwordResetTokens.token, token));
  }

  async deleteExpiredTokens(): Promise<void> {
    const now = new Date();
    await db.delete(schema.passwordResetTokens)
      .where(sql`${schema.passwordResetTokens.expiresAt} < ${now}`);
  }

  // Messages (Internal Messaging)
  async getConversations(userType: string, userId: number): Promise<Array<{
    conversationId: string;
    otherPartyId: number;
    otherPartyName: string;
    lastMessage: string;
    lastMessageAt: Date;
    unreadCount: number;
  }>> {
    // Get all unique conversations for this user
    const messages = await db.select().from(schema.messages)
      .where(sql`
        (${schema.messages.senderType} = ${userType} AND ${schema.messages.senderId} = ${userId})
        OR
        (${schema.messages.recipientType} = ${userType} AND ${schema.messages.recipientId} = ${userId})
      `)
      .orderBy(desc(schema.messages.createdAt));

    // Group by conversation and get latest message + unread count
    const conversationMap = new Map<string, {
      conversationId: string;
      otherPartyId: number;
      otherPartyName: string;
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      if (!conversationMap.has(msg.conversationId)) {
        // Determine other party
        const isRecipient = msg.recipientType === userType && msg.recipientId === userId;
        const otherPartyId = isRecipient ? msg.senderId : msg.recipientId;
        const otherPartyName = isRecipient ? msg.senderName : `Customer #${msg.recipientId}`;

        conversationMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          otherPartyId,
          otherPartyName,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }

      // Count unread messages
      const conv = conversationMap.get(msg.conversationId)!;
      if (msg.recipientType === userType && msg.recipientId === userId && msg.isRead === 0) {
        conv.unreadCount++;
      }
    }

    return Array.from(conversationMap.values());
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return await db.select().from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(asc(schema.messages.createdAt));
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const results = await db.select().from(schema.messages)
      .where(eq(schema.messages.id, id))
      .limit(1);
    return results[0];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(schema.messages).values(message).returning();
    return result[0];
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db.update(schema.messages)
      .set({ isRead: 1 })
      .where(eq(schema.messages.id, id));
  }

  async markConversationAsRead(conversationId: string, recipientId: number): Promise<void> {
    await db.update(schema.messages)
      .set({ isRead: 1 })
      .where(and(
        eq(schema.messages.conversationId, conversationId),
        eq(schema.messages.recipientId, recipientId)
      ));
  }

  async deleteMessage(id: number): Promise<boolean> {
    await db.delete(schema.messages)
      .where(eq(schema.messages.id, id));
    return true;
  }

  // Customer-Admin Conversations removed - customers now defined by orders
  // Use order-based communication instead

  // Admin conversations simplified - no customer references
  async getAdminConversations(status?: 'open' | 'closed'): Promise<any[]> {
    let whereClause = sql`1=1`;
    if (status) {
      whereClause = eq(schema.conversations.status, status);
    }

    const result = await db.select({
      id: schema.conversations.id,
      subject: schema.conversations.subject,
      status: schema.conversations.status,
      createdAt: schema.conversations.createdAt,
      customerName: sql<string>`'Contact anonyme'`,
      customerEmail: sql<string>`'contact@dounie-cuisine.fr'`,
    })
    .from(schema.conversations)
    .where(whereClause)
    .orderBy(desc(schema.conversations.createdAt));

    return result;
  }

  async getConversationById(id: number): Promise<Conversation | undefined> {
    const result = await db.select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, id))
      .limit(1);

    return result[0];
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(schema.conversations).values(conversation).returning();
    return result[0];
  }

  async deleteConversation(id: number): Promise<boolean> {
    // First delete all messages in the conversation
    await db.delete(schema.conversationMessages)
      .where(eq(schema.conversationMessages.conversationId, id));
    
    // Then delete the conversation
    const result = await db.delete(schema.conversations)
      .where(eq(schema.conversations.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async closeConversation(id: number, adminId: number): Promise<void> {
    await db.update(schema.conversations)
      .set({
        status: 'closed',
        closedAt: new Date(),
        closedByAdminId: adminId,
      })
      .where(eq(schema.conversations.id, id));
  }

  async reopenConversation(id: number, customerId?: number): Promise<boolean> {
    // Build WHERE clause with ownership check if customerId provided
    const whereConditions = customerId 
      ? and(
          eq(schema.conversations.id, id),
          eq(schema.conversations.customerId, customerId)
        )
      : eq(schema.conversations.id, id);
    
    const result = await db.update(schema.conversations)
      .set({
        status: 'open',
        closedAt: null,
        closedByAdminId: null,
      })
      .where(whereConditions)
      .returning();
    
    return result.length > 0;
  }

  async updateConversationUnreadCounts(conversationId: number, incrementCustomer?: boolean, incrementAdmin?: boolean): Promise<void> {
    const updates: any = {
      lastMessageAt: new Date(),
    };
    
    if (incrementCustomer) {
      updates.unreadByCustomer = sql`${schema.conversations.unreadByCustomer} + 1`;
    }
    
    if (incrementAdmin) {
      updates.unreadByAdmin = sql`${schema.conversations.unreadByAdmin} + 1`;
    }

    await db.update(schema.conversations)
      .set(updates)
      .where(eq(schema.conversations.id, conversationId));
  }

  async markConversationReadByCustomer(conversationId: number): Promise<void> {
    await db.update(schema.conversations)
      .set({ unreadByCustomer: 0 })
      .where(eq(schema.conversations.id, conversationId));
  }

  async markConversationReadByAdmin(conversationId: number): Promise<void> {
    await db.update(schema.conversations)
      .set({ unreadByAdmin: 0 })
      .where(eq(schema.conversations.id, conversationId));
  }

  // Conversation Messages
  async getConversationMessages(conversationId: number): Promise<Array<ConversationMessage & { adminUsername?: string }>> {
    const results = await db.select({
      id: schema.conversationMessages.id,
      conversationId: schema.conversationMessages.conversationId,
      message: schema.conversationMessages.message,
      fromType: schema.conversationMessages.fromType,
      fromAdminId: schema.conversationMessages.fromAdminId,
      createdAt: schema.conversationMessages.createdAt,
      adminUsername: schema.adminUsers.username,
    })
    .from(schema.conversationMessages)
    .leftJoin(schema.adminUsers, eq(schema.conversationMessages.fromAdminId, schema.adminUsers.id))
    .where(eq(schema.conversationMessages.conversationId, conversationId))
    .orderBy(asc(schema.conversationMessages.createdAt));

    return results as Array<ConversationMessage & { adminUsername?: string }>;
  }

  async createConversationMessage(message: InsertConversationMessage): Promise<ConversationMessage> {
    const result = await db.insert(schema.conversationMessages).values(message).returning();
    
    // Update conversation last_message_at and unread counters
    const updateData: any = {
      lastMessageAt: new Date().toISOString(),
    };
    
    if (message.fromType === 'customer') {
      updateData.unreadByAdmin = sql`unread_by_admin + 1`;
    } else {
      updateData.unreadByCustomer = sql`unread_by_customer + 1`;
    }
    
    await db.update(schema.conversations)
      .set(updateData)
      .where(eq(schema.conversations.id, message.conversationId));
    
    return result[0];
  }

  async markConversationAsReadByCustomer(conversationId: number): Promise<void> {
    await db.update(schema.conversations)
      .set({ unreadByCustomer: 0 })
      .where(eq(schema.conversations.id, conversationId));
  }

  async markConversationAsReadByAdmin(conversationId: number): Promise<void> {
    await db.update(schema.conversations)
      .set({ unreadByAdmin: 0 })
      .where(eq(schema.conversations.id, conversationId));
  }

  // Menu Sections
  async getMenuSections(activeOnly?: boolean): Promise<MenuSection[]> {
    if (activeOnly) {
      return await db.select().from(schema.menuSections)
        .where(eq(schema.menuSections.isActive, 1))
        .orderBy(asc(schema.menuSections.displayOrder));
    }
    return await db.select().from(schema.menuSections)
      .orderBy(asc(schema.menuSections.displayOrder));
  }

  async getMenuSection(id: number): Promise<MenuSection | undefined> {
    const results = await db.select().from(schema.menuSections)
      .where(eq(schema.menuSections.id, id))
      .limit(1);
    return results[0];
  }

  async createMenuSection(section: InsertMenuSection): Promise<MenuSection> {
    const result = await db.insert(schema.menuSections).values(section).returning();
    return result[0];
  }

  async updateMenuSection(id: number, section: Partial<InsertMenuSection>): Promise<MenuSection | undefined> {
    const result = await db.update(schema.menuSections)
      .set(section)
      .where(eq(schema.menuSections.id, id))
      .returning();
    return result[0];
  }

  async deleteMenuSection(id: number): Promise<boolean> {
    const result = await db.delete(schema.menuSections)
      .where(eq(schema.menuSections.id, id))
      .returning();
    return result.length > 0;
  }

  // Catering Menu Items
  async getCateringMenuItems(activeOnly?: boolean): Promise<CateringMenuItem[]> {
    if (activeOnly) {
      return await db.select().from(schema.cateringMenuItems)
        .where(eq(schema.cateringMenuItems.isActive, 1))
        .orderBy(asc(schema.cateringMenuItems.displayOrder));
    }
    return await db.select().from(schema.cateringMenuItems)
      .orderBy(asc(schema.cateringMenuItems.displayOrder));
  }

  async getCateringMenuItem(id: number): Promise<CateringMenuItem | undefined> {
    const results = await db.select().from(schema.cateringMenuItems)
      .where(eq(schema.cateringMenuItems.id, id))
      .limit(1);
    return results[0];
  }

  async createCateringMenuItem(item: InsertCateringMenuItem): Promise<CateringMenuItem> {
    const result = await db.insert(schema.cateringMenuItems).values(item).returning();
    return result[0];
  }

  async updateCateringMenuItem(id: number, item: Partial<InsertCateringMenuItem>): Promise<CateringMenuItem | undefined> {
    const result = await db.update(schema.cateringMenuItems)
      .set(item)
      .where(eq(schema.cateringMenuItems.id, id))
      .returning();
    return result[0];
  }

  async deleteCateringMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(schema.cateringMenuItems)
      .where(eq(schema.cateringMenuItems.id, id))
      .returning();
    return result.length > 0;
  }

  // Catering Decorative Images
  async getCateringDecorativeImages(activeOnly?: boolean): Promise<CateringDecorativeImage[]> {
    if (activeOnly) {
      return await db.select().from(schema.cateringDecorativeImages)
        .where(eq(schema.cateringDecorativeImages.isActive, 1))
        .orderBy(asc(schema.cateringDecorativeImages.displayOrder));
    }
    return await db.select().from(schema.cateringDecorativeImages)
      .orderBy(asc(schema.cateringDecorativeImages.displayOrder));
  }

  async getCateringDecorativeImage(id: number): Promise<CateringDecorativeImage | undefined> {
    const results = await db.select().from(schema.cateringDecorativeImages)
      .where(eq(schema.cateringDecorativeImages.id, id))
      .limit(1);
    return results[0];
  }

  async createCateringDecorativeImage(image: InsertCateringDecorativeImage): Promise<CateringDecorativeImage> {
    const result = await db.insert(schema.cateringDecorativeImages).values(image).returning();
    return result[0];
  }

  async updateCateringDecorativeImage(id: number, image: Partial<InsertCateringDecorativeImage>): Promise<CateringDecorativeImage | undefined> {
    const result = await db.update(schema.cateringDecorativeImages)
      .set(image)
      .where(eq(schema.cateringDecorativeImages.id, id))
      .returning();
    return result[0];
  }

  async deleteCateringDecorativeImage(id: number): Promise<boolean> {
    const result = await db.delete(schema.cateringDecorativeImages)
      .where(eq(schema.cateringDecorativeImages.id, id))
      .returning();
    return result.length > 0;
  }

  // Note: Weekly Menus, Menu Day Assignments, and Menu Dishes methods removed - replaced by new takeout menu system

  // Delivery Zones
  async getDeliveryZones(): Promise<schema.DeliveryZone[]> {
    return await db.select().from(schema.deliveryZones)
      .orderBy(asc(schema.deliveryZones.distanceMinKm));
  }

  async getDeliveryZone(id: number): Promise<schema.DeliveryZone | undefined> {
    const results = await db.select().from(schema.deliveryZones)
      .where(eq(schema.deliveryZones.id, id))
      .limit(1);
    return results[0];
  }

  async createDeliveryZone(zone: schema.InsertDeliveryZone): Promise<schema.DeliveryZone> {
    const results = await db.insert(schema.deliveryZones)
      .values({ ...zone, updatedAt: new Date() })
      .returning();
    return results[0];
  }

  async updateDeliveryZone(id: number, zone: Partial<schema.InsertDeliveryZone>): Promise<schema.DeliveryZone | undefined> {
    await db.update(schema.deliveryZones)
      .set({ ...zone, updatedAt: new Date() })
      .where(eq(schema.deliveryZones.id, id));
    return await this.getDeliveryZone(id);
  }

  async deleteDeliveryZone(id: number): Promise<boolean> {
    await db.delete(schema.deliveryZones)
      .where(eq(schema.deliveryZones.id, id));
    return true;
  }

  async getDeliveryPriceForDistance(distanceKm: number): Promise<number | null> {
    const zones = await db.select().from(schema.deliveryZones)
      .where(
        and(
          eq(schema.deliveryZones.isActive, 1),
          sql`${schema.deliveryZones.distanceMinKm} <= ${distanceKm}`,
          sql`${schema.deliveryZones.distanceMaxKm} >= ${distanceKm}`
        )
      )
      .orderBy(asc(schema.deliveryZones.distanceMinKm))
      .limit(1);
    
    if (zones.length === 0) return null;
    return parseFloat(zones[0].deliveryPrice);
  }

  // Takeout Menus
  async getTakeoutMenus(): Promise<TakeoutMenu[]> {
    return await db.select().from(schema.takeoutMenus).orderBy(asc(schema.takeoutMenus.displayOrder));
  }

  async getActiveTakeoutMenu(): Promise<TakeoutMenu | undefined> {
    const menus = await db.select().from(schema.takeoutMenus)
      .where(eq(schema.takeoutMenus.isActive, 1))
      .limit(1);
    return menus[0];
  }

  async getTakeoutMenu(id: number): Promise<TakeoutMenu | undefined> {
    const menus = await db.select().from(schema.takeoutMenus).where(eq(schema.takeoutMenus.id, id));
    return menus[0];
  }

  async createTakeoutMenu(menu: InsertTakeoutMenu): Promise<TakeoutMenu> {
    const [newMenu] = await db.insert(schema.takeoutMenus).values(menu).returning();
    return newMenu;
  }

  async updateTakeoutMenu(id: number, menu: Partial<InsertTakeoutMenu>): Promise<TakeoutMenu | undefined> {
    const [updated] = await db.update(schema.takeoutMenus)
      .set({ ...menu, updatedAt: new Date() })
      .where(eq(schema.takeoutMenus.id, id))
      .returning();
    return updated;
  }

  async deleteTakeoutMenu(id: number): Promise<boolean> {
    const result = await db.delete(schema.takeoutMenus).where(eq(schema.takeoutMenus.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async setActiveTakeoutMenu(id: number): Promise<void> {
    await db.update(schema.takeoutMenus).set({ isActive: 0 });
    await db.update(schema.takeoutMenus).set({ isActive: 1 }).where(eq(schema.takeoutMenus.id, id));
  }

  async setTakeoutMenuStatus(id: number, isActive: boolean): Promise<void> {
    await db.update(schema.takeoutMenus)
      .set({ isActive: isActive ? 1 : 0 })
      .where(eq(schema.takeoutMenus.id, id));
  }

  // Takeout Menu Sections
  async getTakeoutMenuSections(menuId: number): Promise<TakeoutMenuSection[]> {
    return await db.select().from(schema.takeoutMenuSections)
      .where(eq(schema.takeoutMenuSections.menuId, menuId))
      .orderBy(asc(schema.takeoutMenuSections.displayOrder));
  }

  async getTakeoutMenuSection(id: number): Promise<TakeoutMenuSection | undefined> {
    const sections = await db.select().from(schema.takeoutMenuSections)
      .where(eq(schema.takeoutMenuSections.id, id));
    return sections[0];
  }

  async createTakeoutMenuSection(section: InsertTakeoutMenuSection): Promise<TakeoutMenuSection> {
    const [newSection] = await db.insert(schema.takeoutMenuSections).values(section).returning();
    return newSection;
  }

  async updateTakeoutMenuSection(id: number, section: Partial<InsertTakeoutMenuSection>): Promise<TakeoutMenuSection | undefined> {
    const [updated] = await db.update(schema.takeoutMenuSections)
      .set({ ...section, updatedAt: new Date() })
      .where(eq(schema.takeoutMenuSections.id, id))
      .returning();
    return updated;
  }

  async deleteTakeoutMenuSection(id: number): Promise<boolean> {
    const result = await db.delete(schema.takeoutMenuSections).where(eq(schema.takeoutMenuSections.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderTakeoutMenuSections(menuId: number, sectionOrders: Array<{ id: number; displayOrder: number }>): Promise<void> {
    for (const { id, displayOrder } of sectionOrders) {
      await db.update(schema.takeoutMenuSections)
        .set({ displayOrder, updatedAt: new Date() })
        .where(and(
          eq(schema.takeoutMenuSections.id, id),
          eq(schema.takeoutMenuSections.menuId, menuId)
        ));
    }
  }

  // Takeout Section Dishes
  async getTakeoutSectionDishes(sectionId: number): Promise<Array<TakeoutSectionDish & { dish: Dish }>> {
    const assignments = await db.select({
      id: schema.takeoutSectionDishes.id,
      sectionId: schema.takeoutSectionDishes.sectionId,
      dishId: schema.takeoutSectionDishes.dishId,
      displayOrder: schema.takeoutSectionDishes.displayOrder,
      createdAt: schema.takeoutSectionDishes.createdAt,
      dish: schema.dishes
    })
      .from(schema.takeoutSectionDishes)
      .innerJoin(schema.dishes, eq(schema.takeoutSectionDishes.dishId, schema.dishes.id))
      .where(eq(schema.takeoutSectionDishes.sectionId, sectionId))
      .orderBy(asc(schema.takeoutSectionDishes.displayOrder));
    
    return assignments as Array<TakeoutSectionDish & { dish: Dish }>;
  }

  async createTakeoutSectionDish(assignment: InsertTakeoutSectionDish): Promise<TakeoutSectionDish> {
    const [newAssignment] = await db.insert(schema.takeoutSectionDishes).values(assignment).returning();
    return newAssignment;
  }

  async deleteTakeoutSectionDish(id: number): Promise<boolean> {
    const result = await db.delete(schema.takeoutSectionDishes).where(eq(schema.takeoutSectionDishes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderTakeoutSectionDishes(sectionId: number, dishOrders: Array<{ id: number; displayOrder: number }>): Promise<void> {
    for (const { id, displayOrder } of dishOrders) {
      await db.update(schema.takeoutSectionDishes)
        .set({ displayOrder })
        .where(and(
          eq(schema.takeoutSectionDishes.id, id),
          eq(schema.takeoutSectionDishes.sectionId, sectionId)
        ));
    }
  }

  // NEW FLEXIBLE CATERING SYSTEM
  // Catering Categories
  async getCateringCategories(activeOnly: boolean = false): Promise<CateringCategory[]> {
    const query = db.select().from(schema.cateringCategories);
    if (activeOnly) {
      query.where(eq(schema.cateringCategories.isActive, 1));
    }
    return await query.orderBy(asc(schema.cateringCategories.displayOrder));
  }

  async getCateringCategory(id: number): Promise<CateringCategory | undefined> {
    const categories = await db.select().from(schema.cateringCategories).where(eq(schema.cateringCategories.id, id));
    return categories[0];
  }

  async createCateringCategory(category: InsertCateringCategory): Promise<CateringCategory> {
    // Nettoyer les valeurs null/undefined pour éviter les erreurs TypeScript
    const cleanCategory = {
      ...category,
      nameEn: category.nameEn || "",
      descriptionFr: category.descriptionFr || null,
      descriptionEn: category.descriptionEn || null,
    };
    const [newCategory] = await db.insert(schema.cateringCategories).values(cleanCategory).returning();
    return newCategory;
  }

  async updateCateringCategory(id: number, category: Partial<InsertCateringCategory>): Promise<CateringCategory | undefined> {
    // Nettoyer les valeurs null/undefined pour éviter les erreurs TypeScript
    const cleanCategory: any = { ...category };
    if (cleanCategory.nameEn === null) {
      delete cleanCategory.nameEn;
    }
    if (cleanCategory.descriptionFr === null) {
      delete cleanCategory.descriptionFr;
    }
    if (cleanCategory.descriptionEn === null) {
      delete cleanCategory.descriptionEn;
    }
    
    const [updated] = await db.update(schema.cateringCategories)
      .set({ ...cleanCategory, updatedAt: new Date() })
      .where(eq(schema.cateringCategories.id, id))
      .returning();
    return updated;
  }

  async deleteCateringCategory(id: number): Promise<boolean> {
    const result = await db.delete(schema.cateringCategories).where(eq(schema.cateringCategories.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderCateringCategories(categoryOrders: { id: number; displayOrder: number }[]): Promise<boolean> {
    try {
      for (const { id, displayOrder } of categoryOrders) {
        await db.update(schema.cateringCategories)
          .set({ displayOrder, updatedAt: new Date() })
          .where(eq(schema.cateringCategories.id, id));
      }
      return true;
    } catch (error) {
      console.error('Error reordering catering categories:', error);
      return false;
    }
  }

  // Catering Items
  async getCateringItems(categoryId?: number, activeOnly: boolean = false): Promise<CateringItem[]> {
    const conditions = [];
    if (categoryId) {
      conditions.push(eq(schema.cateringItems.categoryId, categoryId));
    }
    if (activeOnly) {
      conditions.push(eq(schema.cateringItems.isActive, 1));
    }
    
    let query = db.select().from(schema.cateringItems);
    
    if (conditions.length > 0) {
      return await query
        .where(and(...conditions))
        .orderBy(asc(schema.cateringItems.displayOrder));
    }
    
    return await query.orderBy(asc(schema.cateringItems.displayOrder));
  }

  async getCateringItem(id: number): Promise<CateringItem | undefined> {
    const items = await db.select().from(schema.cateringItems).where(eq(schema.cateringItems.id, id));
    return items[0];
  }

  async createCateringItem(item: InsertCateringItem): Promise<CateringItem> {
    // Nettoyer les valeurs null/undefined pour éviter les erreurs TypeScript
    const cleanItem = {
      ...item,
      nameEn: item.nameEn || "",
      descriptionFr: item.descriptionFr || null,
      descriptionEn: item.descriptionEn || null,
      imageId: item.imageId || null,
    };
    const [newItem] = await db.insert(schema.cateringItems).values(cleanItem).returning();
    return newItem;
  }

  async updateCateringItem(id: number, item: Partial<InsertCateringItem>): Promise<CateringItem | undefined> {
    // Nettoyer les valeurs null/undefined pour éviter les erreurs TypeScript
    const cleanItem: any = { ...item };
    if (cleanItem.nameEn === null) {
      delete cleanItem.nameEn;
    }
    if (cleanItem.descriptionFr === null) {
      delete cleanItem.descriptionFr;
    }
    if (cleanItem.descriptionEn === null) {
      delete cleanItem.descriptionEn;
    }
    if (cleanItem.imageId === null) {
      delete cleanItem.imageId;
    }
    
    const [updated] = await db.update(schema.cateringItems)
      .set({ ...cleanItem, updatedAt: new Date() })
      .where(eq(schema.cateringItems.id, id))
      .returning();
    return updated;
  }

  async deleteCateringItem(id: number): Promise<boolean> {
    const result = await db.delete(schema.cateringItems).where(eq(schema.cateringItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Catering Item Prices
  async getCateringItemPrices(itemId?: number): Promise<CateringItemPrice[]> {
    if (itemId !== undefined) {
      return await db.select()
        .from(schema.cateringItemPrices)
        .where(eq(schema.cateringItemPrices.itemId, itemId))
        .orderBy(asc(schema.cateringItemPrices.displayOrder));
    } else {
      // Return all prices when no itemId is provided
      return await db.select()
        .from(schema.cateringItemPrices)
        .orderBy(asc(schema.cateringItemPrices.displayOrder));
    }
  }

  async getCateringItemPrice(id: number): Promise<CateringItemPrice | undefined> {
    const prices = await db.select().from(schema.cateringItemPrices).where(eq(schema.cateringItemPrices.id, id));
    return prices[0];
  }

  async createCateringItemPrice(price: InsertCateringItemPrice): Promise<CateringItemPrice> {
    // Nettoyer les valeurs null/undefined pour éviter les erreurs TypeScript
    const cleanPrice = {
      ...price,
      sizeLabelEn: price.sizeLabelEn || "",
    };
    const [newPrice] = await db.insert(schema.cateringItemPrices).values(cleanPrice).returning();
    return newPrice;
  }

  async updateCateringItemPrice(id: number, price: Partial<InsertCateringItemPrice>): Promise<CateringItemPrice | undefined> {
    // Nettoyer les valeurs null/undefined pour éviter les erreurs TypeScript
    const cleanPrice: any = { ...price };
    if (cleanPrice.sizeLabelEn === null) {
      delete cleanPrice.sizeLabelEn;
    }
    
    const [updated] = await db.update(schema.cateringItemPrices)
      .set({ ...cleanPrice, updatedAt: new Date() })
      .where(eq(schema.cateringItemPrices.id, id))
      .returning();
    return updated;
  }

  async deleteCateringItemPrice(id: number): Promise<boolean> {
    const result = await db.delete(schema.cateringItemPrices).where(eq(schema.cateringItemPrices.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Complete Catering Menu with Categories, Items and Prices
  async getCompleteCateringMenu(): Promise<(CateringCategory & { 
    items: (CateringItem & { prices: CateringItemPrice[] })[] 
  })[]> {
    // Get all categories
    const categories = await this.getCateringCategories(true);
    
    // For each category, get items and their prices
    const result = [];
    for (const category of categories) {
      const items = await this.getCateringItems(category.id, true);
      const itemsWithPrices = [];
      
      for (const item of items) {
        const prices = await this.getCateringItemPrices(item.id);
        itemsWithPrices.push({ ...item, prices });
      }
      
      result.push({ ...category, items: itemsWithPrices });
    }
    
    return result;
  }

  // Media Assets
  async getMediaAsset(id: number): Promise<MediaAsset | undefined> {
    const assets = await db.select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, id));
    return assets[0];
  }

  async createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset> {
    const [newAsset] = await db.insert(schema.mediaAssets).values(asset).returning();
    return newAsset;
  }

  async deleteMediaAsset(id: number): Promise<boolean> {
    const result = await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ============================================================================  
  // EMAIL TEMPLATES - Nouveau système unifié

  // Dashboard Statistics
  async getDashboardStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalMessages: number;
    totalConversations: number;
    activeConversations: number;
    unreadMessages: number;
    ordersGrowth: number;
    revenueGrowth: number;
    messagesGrowth: number;
    conversationsGrowth: number;
  }> {
    try {
      // Get total orders count
      const totalOrdersResult = await db.select({ count: sql`count(*)` }).from(schema.orders);
      const totalOrders = Number(totalOrdersResult[0]?.count || 0);

      // Get total revenue
      const totalRevenueResult = await db.select({ 
        total: sql`sum(${schema.orders.totalAmount})` 
      }).from(schema.orders)
      .where(eq(schema.orders.paymentStatus, 'completed'));
      const totalRevenue = Number(totalRevenueResult[0]?.total || 0);

      // Get total messages count (safe)
      let totalMessages = 0;
      let unreadMessages = 0;
      try {
        const totalMessagesResult = await db.select({ count: sql`count(*)` })
          .from(schema.contactMessages);
        totalMessages = Number(totalMessagesResult[0]?.count || 0);

        // Get unread messages count
        const unreadMessagesResult = await db.select({ count: sql`count(*)` })
          .from(schema.contactMessages)
          .where(eq(schema.contactMessages.status, 'new'));
        unreadMessages = Number(unreadMessagesResult[0]?.count || 0);
      } catch (error) {
        console.warn('contactMessages table not found, skipping messages stats');
      }

      // Get conversations count (safe)
      let totalConversations = 0;
      let activeConversations = 0;
      try {
        const totalConversationsResult = await db.select({ count: sql`count(*)` })
          .from(schema.conversations);
        totalConversations = Number(totalConversationsResult[0]?.count || 0);

        // Get active conversations count
        const activeConversationsResult = await db.select({ count: sql`count(*)` })
          .from(schema.conversations)
          .where(eq(schema.conversations.status, 'open'));
        activeConversations = Number(activeConversationsResult[0]?.count || 0);
      } catch (error) {
        console.warn('conversations table not found, skipping conversations stats');
      }

      // Calculate growth rates (last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Calculate growth rates (last 30 days vs previous 30 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentOrdersResult = await db.select({ count: sql`count(*)` })
        .from(schema.orders)
        .where(sql`${schema.orders.createdAt} >= ${thirtyDaysAgo}`);
      const recentOrders = Number(recentOrdersResult[0]?.count || 0);

      const previousOrdersResult = await db.select({ count: sql`count(*)` })
        .from(schema.orders)
        .where(and(
          sql`${schema.orders.createdAt} >= ${sixtyDaysAgo}`,
          sql`${schema.orders.createdAt} < ${thirtyDaysAgo}`
        ));
      const previousOrders = Number(previousOrdersResult[0]?.count || 0);

      const recentOrdersGrowth = previousOrders > 0 
        ? ((recentOrders - previousOrders) / previousOrders) * 100 
        : recentOrders > 0 ? 100 : 0;

      // Revenue growth calculation
      const recentRevenueResult = await db.select({ 
        total: sql`sum(${schema.orders.totalAmount})` 
      }).from(schema.orders)
      .where(and(
        eq(schema.orders.status, 'completed'),
        sql`${schema.orders.createdAt} >= ${thirtyDaysAgo}`
      ));
      const recentRevenue = Number(recentRevenueResult[0]?.total || 0);

      const previousRevenueResult = await db.select({ 
        total: sql`sum(${schema.orders.totalAmount})` 
      }).from(schema.orders)
      .where(and(
        eq(schema.orders.status, 'completed'),
        sql`${schema.orders.createdAt} >= ${sixtyDaysAgo}`,
        sql`${schema.orders.createdAt} < ${thirtyDaysAgo}`
      ));
      const previousRevenue = Number(previousRevenueResult[0]?.total || 0);

      const revenueGrowth = previousRevenue > 0 
        ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 
        : recentRevenue > 0 ? 100 : 0;

      // Messages growth calculation (safe)
      let messagesGrowth = 0;
      try {
        const recentMessagesResult = await db.select({ count: sql`count(*)` })
          .from(schema.contactMessages)
          .where(sql`${schema.contactMessages.createdAt} >= ${thirtyDaysAgo}`);
        const recentMessages = Number(recentMessagesResult[0]?.count || 0);

        const previousMessagesResult = await db.select({ count: sql`count(*)` })
          .from(schema.contactMessages)
          .where(and(
            sql`${schema.contactMessages.createdAt} >= ${sixtyDaysAgo}`,
            sql`${schema.contactMessages.createdAt} < ${thirtyDaysAgo}`
          ));
        const previousMessages = Number(previousMessagesResult[0]?.count || 0);

        messagesGrowth = previousMessages > 0 
          ? ((recentMessages - previousMessages) / previousMessages) * 100 
          : recentMessages > 0 ? 100 : 0;
      } catch (error) {
        console.warn('contactMessages table growth calculation failed, using 0');
      }

      // Conversations growth calculation (safe) - table doesn't exist yet
      let conversationsGrowth = 0;

      return {
        totalOrders,
        totalRevenue,
        totalMessages,
        totalConversations,
        activeConversations,
        unreadMessages,
        ordersGrowth: Math.round(recentOrdersGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        messagesGrowth: Math.round(messagesGrowth * 100) / 100,
        conversationsGrowth: Math.round(conversationsGrowth * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalMessages: 0,
        totalConversations: 0,
        activeConversations: 0,
        unreadMessages: 0,
        ordersGrowth: 0,
        revenueGrowth: 0,
        messagesGrowth: 0,
        conversationsGrowth: 0,
      };
    }
  }

  // Count methods for dashboard
  async getDishesCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql`count(*)` }).from(schema.dishes);
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Error getting dishes count:', error);
      return 0;
    }
  }

  async getEventsCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql`count(*)` }).from(schema.events);
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Error getting events count:', error);
      return 0;
    }
  }


  async getRecentActivity(): Promise<Array<{
    id: string;
    type: 'order' | 'message' | 'conversation' | 'customer' | 'event';
    title: string;
    description: string;
    timestamp: Date;
    entityId?: number;
    link?: string;
  }>> {
    try {
      const activities: Array<{
        id: string;
        type: 'order' | 'message' | 'conversation' | 'customer' | 'event';
        title: string;
        description: string;
        timestamp: Date;
        entityId?: number;
        link?: string;
      }> = [];

      // Get recent orders
      const recentOrders = await db.select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        customerName: schema.orders.customerName,
        totalAmount: schema.orders.totalAmount,
        createdAt: schema.orders.createdAt,
      }).from(schema.orders)
      .orderBy(desc(schema.orders.createdAt))
      .limit(5);

      recentOrders.forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: `Nouvelle commande ${order.orderNumber}`,
          description: `${order.customerName} - $${order.totalAmount} CAD`,
          timestamp: order.createdAt,
          entityId: order.id,
          link: `/admin/orders/${order.id}`
        });
      });

      // Get recent messages
      const recentMessages = await db.select({
        id: schema.contactMessages.id,
        name: schema.contactMessages.name,
        subject: schema.contactMessages.subject,
        inquiryType: schema.contactMessages.inquiryType,
        createdAt: schema.contactMessages.createdAt,
      }).from(schema.contactMessages)
      .orderBy(desc(schema.contactMessages.createdAt))
      .limit(5);

      recentMessages.forEach(message => {
        activities.push({
          id: `message-${message.id}`,
          type: 'message',
          title: `Nouveau message de ${message.name}`,
          description: message.subject || `Type: ${message.inquiryType}`,
          timestamp: message.createdAt,
          entityId: message.id,
          link: `/admin/messages`
        });
      });

      // Get recent conversations (table doesn't exist yet, skip)
      // TODO: Add when conversations table is created

      // Sort all activities by timestamp and return top 15
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 15);

    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // ============================================================================
  // CATERING SYSTEM METHODS
  // ============================================================================

  async getCateringMenu(): Promise<any[]> {
    try {
      // Get categories with active items and their prices
      const categories = await db.select().from(schema.cateringCategories)
        .where(eq(schema.cateringCategories.isActive, 1))
        .orderBy(asc(schema.cateringCategories.displayOrder));

      const result = [];
      for (const category of categories) {
        // Get items for this category
        const items = await db.select().from(schema.cateringItems)
          .where(and(
            eq(schema.cateringItems.categoryId, category.id),
            eq(schema.cateringItems.isActive, 1)
          ))
          .orderBy(asc(schema.cateringItems.displayOrder));

        // Get prices for each item
        const itemsWithPrices = [];
        for (const item of items) {
          const prices = await db.select().from(schema.cateringItemPrices)
            .where(eq(schema.cateringItemPrices.itemId, item.id))
            .orderBy(asc(schema.cateringItemPrices.displayOrder));

          itemsWithPrices.push({
            id: item.id,
            name_fr: item.nameFr,
            name_en: item.nameEn,
            description_fr: item.descriptionFr,
            description_en: item.descriptionEn,
            image_id: item.imageId,
            display_order: item.displayOrder,
            is_active: item.isActive,
            prices: prices.map(p => ({
              id: p.id,
              size_label_fr: p.sizeLabelFr,
              size_label_en: p.sizeLabelEn,
              price: parseFloat(p.price),
              is_default: p.isDefault,
              display_order: p.displayOrder
            }))
          });
        }

        result.push({
          id: category.id,
          name_fr: category.nameFr,
          name_en: category.nameEn,
          description_fr: category.descriptionFr,
          description_en: category.descriptionEn,
          display_order: category.displayOrder,
          is_active: category.isActive,
          items: itemsWithPrices
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting catering menu:', error);
      throw error;
    }
  }

  // ========================================
  // DISH CATEGORIES
  // ========================================
  async getAllCategories(): Promise<schema.DishCategory[]> {
    return await db.select().from(schema.dishCategories)
      .orderBy(asc(schema.dishCategories.displayOrder));
  }

  async createCategory(category: schema.InsertDishCategory): Promise<schema.DishCategory> {
    const result = await db.insert(schema.dishCategories).values(category).returning();
    if (result.length === 0) {
      throw new Error("Failed to create category");
    }
    return result[0];
  }

  async updateCategory(id: number, category: Partial<schema.InsertDishCategory>): Promise<schema.DishCategory | undefined> {
    const result = await db.update(schema.dishCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(schema.dishCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(schema.dishCategories).where(eq(schema.dishCategories.id, id));
    return true;
  }

  // ========================================
  // DISH VARIANTS
  // ========================================
  async getAllVariants(): Promise<schema.DishVariantNew[]> {
    return await db.select().from(schema.dishVariantsNew)
      .orderBy(asc(schema.dishVariantsNew.displayOrder));
  }

  async getDishVariants(dishId: number): Promise<schema.DishVariantNew[]> {
    return await db.select().from(schema.dishVariantsNew)
      .where(eq(schema.dishVariantsNew.dishId, dishId))
      .orderBy(asc(schema.dishVariantsNew.displayOrder));
  }

  async createVariant(variant: schema.InsertDishVariant): Promise<schema.DishVariantNew> {
    const result = await db.insert(schema.dishVariantsNew).values(variant).returning();
    if (result.length === 0) {
      throw new Error("Failed to create variant");
    }
    return result[0];
  }

  async updateVariant(id: number, variant: Partial<schema.InsertDishVariant>): Promise<schema.DishVariantNew | undefined> {
    const result = await db.update(schema.dishVariantsNew)
      .set({ ...variant, updatedAt: new Date() })
      .where(eq(schema.dishVariantsNew.id, id))
      .returning();
    return result[0];
  }

  async deleteVariant(id: number): Promise<boolean> {
    await db.delete(schema.dishVariantsNew).where(eq(schema.dishVariantsNew.id, id));
    return true;
  }

  // ========================================
  // GALLERY PHOTOS
  // ========================================
  async getGalleryPhotos(albumId?: number): Promise<schema.GalleryPhoto[]> {
    if (albumId !== undefined) {
      return await db.select().from(schema.galleryPhotos)
        .where(eq(schema.galleryPhotos.albumId, albumId))
        .orderBy(asc(schema.galleryPhotos.displayOrder));
    }
    return await db.select().from(schema.galleryPhotos)
      .orderBy(asc(schema.galleryPhotos.displayOrder));
  }

  async createGalleryPhoto(photo: schema.InsertGalleryPhoto): Promise<schema.GalleryPhoto> {
    const result = await db.insert(schema.galleryPhotos).values(photo).returning();
    if (result.length === 0) {
      throw new Error("Failed to create gallery photo");
    }
    return result[0];
  }

  async updateGalleryPhoto(id: number, photo: Partial<schema.InsertGalleryPhoto>): Promise<schema.GalleryPhoto | undefined> {
    const result = await db.update(schema.galleryPhotos)
      .set(photo)
      .where(eq(schema.galleryPhotos.id, id))
      .returning();
    return result[0];
  }

  // ========================================
  // SIDES & DISH SIDES (Accompagnements)
  // ========================================
  async getSides(): Promise<schema.Side[]> {
    return await db.select().from(schema.sides)
      .where(eq(schema.sides.isActive, 1))
      .orderBy(asc(schema.sides.displayOrder), asc(schema.sides.name));
  }

  async getSide(id: number): Promise<schema.Side | undefined> {
    const result = await db.select().from(schema.sides).where(eq(schema.sides.id, id));
    return result[0];
  }

  async createSide(side: schema.InsertSide): Promise<schema.Side> {
    const result = await db.insert(schema.sides).values(side).returning();
    if (result.length === 0) {
      throw new Error("Failed to create side");
    }
    return result[0];
  }

  async updateSide(id: number, side: Partial<schema.InsertSide>): Promise<schema.Side | undefined> {
    const result = await db.update(schema.sides)
      .set({ ...side, updatedAt: new Date() })
      .where(eq(schema.sides.id, id))
      .returning();
    return result[0];
  }

  async deleteSide(id: number): Promise<boolean> {
    await db.delete(schema.sides).where(eq(schema.sides.id, id));
    return true;
  }

  // Dish Sides Relations
  async getDishSides(dishId: number): Promise<Array<schema.Side & { isIncluded: number; extraPrice: string | null; displayOrder: number | null }>> {
    return await db.select({
      id: schema.sides.id,
      name: schema.sides.name,
      description: schema.sides.description,
      price: schema.sides.price,
      category: schema.sides.category,
      allergens: schema.sides.allergens,
      isActive: schema.sides.isActive,
      displayOrder: schema.dishSides.displayOrder,
      createdAt: schema.sides.createdAt,
      updatedAt: schema.sides.updatedAt,
      isIncluded: schema.dishSides.isIncluded,
      extraPrice: schema.dishSides.extraPrice,
    })
    .from(schema.dishSides)
    .innerJoin(schema.sides, eq(schema.dishSides.sideId, schema.sides.id))
    .where(and(
      eq(schema.dishSides.dishId, dishId),
      eq(schema.sides.isActive, 1)
    ))
    .orderBy(asc(schema.dishSides.displayOrder));
  }

  async addDishSide(dishSide: schema.InsertDishSide): Promise<schema.DishSide> {
    const result = await db.insert(schema.dishSides).values(dishSide).returning();
    if (result.length === 0) {
      throw new Error("Failed to add dish side");
    }
    return result[0];
  }

  async removeDishSide(dishId: number, sideId: number): Promise<boolean> {
    await db.delete(schema.dishSides)
      .where(and(
        eq(schema.dishSides.dishId, dishId),
        eq(schema.dishSides.sideId, sideId)
      ));
    return true;
  }

  async updateDishSide(dishId: number, sideId: number, updates: Partial<schema.InsertDishSide>): Promise<boolean> {
    await db.update(schema.dishSides)
      .set(updates)
      .where(and(
        eq(schema.dishSides.dishId, dishId),
        eq(schema.dishSides.sideId, sideId)
      ));
    return true;
  }

  // ========================================
  // NOUVELLES MÉTHODES POUR SYNCHRONISATION 100%
  // ========================================

  // CATERING QUOTES
  async getCateringQuotes(): Promise<schema.CateringQuote[]> {
    return await db.select().from(schema.cateringQuotes).orderBy(desc(schema.cateringQuotes.createdAt));
  }

  async getCateringQuote(id: number): Promise<schema.CateringQuote | undefined> {
    const result = await db.select().from(schema.cateringQuotes).where(eq(schema.cateringQuotes.id, id));
    return result[0];
  }

  async createCateringQuote(quote: schema.InsertCateringQuote): Promise<schema.CateringQuote> {
    const insertData = {
      ...quote,
      eventDate: quote.eventDate ? new Date(quote.eventDate) : null,
      estimatedPrice: quote.estimatedPrice ? quote.estimatedPrice.toString() : null
    };
    const result = await db.insert(schema.cateringQuotes).values(insertData).returning();
    if (result.length === 0) {
      throw new Error("Failed to create catering quote");
    }
    return result[0];
  }

  async updateCateringQuote(id: number, quote: Partial<schema.InsertCateringQuote>): Promise<schema.CateringQuote | undefined> {
    const updateData: any = { ...quote, updatedAt: new Date() };
    if (quote.eventDate) {
      updateData.eventDate = new Date(quote.eventDate);
    }
    const result = await db.update(schema.cateringQuotes)
      .set(updateData)
      .where(eq(schema.cateringQuotes.id, id))
      .returning();
    return result[0];
  }

  async deleteCateringQuote(id: number): Promise<boolean> {
    const result = await db.delete(schema.cateringQuotes).where(eq(schema.cateringQuotes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // REVIEWS
  async getReviews(): Promise<schema.Review[]> {
    return await db.select().from(schema.reviews).orderBy(desc(schema.reviews.createdAt));
  }

  async getReview(id: number): Promise<schema.Review | undefined> {
    const result = await db.select().from(schema.reviews).where(eq(schema.reviews.id, id));
    return result[0];
  }

  async createReview(review: schema.InsertReview): Promise<schema.Review> {
    const result = await db.insert(schema.reviews).values(review).returning();
    if (result.length === 0) {
      throw new Error("Failed to create review");
    }
    return result[0];
  }

  async updateReview(id: number, review: Partial<schema.InsertReview>): Promise<schema.Review | undefined> {
    const result = await db.update(schema.reviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(schema.reviews.id, id))
      .returning();
    return result[0];
  }

  async deleteReview(id: number): Promise<boolean> {
    const result = await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // PROMO CODES
  async getPromoCodes(activeOnly: boolean = false): Promise<schema.PromoCode[]> {
    if (activeOnly) {
      return await db.select().from(schema.promoCodes)
        .where(eq(schema.promoCodes.isActive, 1))
        .orderBy(desc(schema.promoCodes.createdAt));
    }
    return await db.select().from(schema.promoCodes).orderBy(desc(schema.promoCodes.createdAt));
  }

  async getPromoCode(id: number): Promise<schema.PromoCode | undefined> {
    const result = await db.select().from(schema.promoCodes).where(eq(schema.promoCodes.id, id));
    return result[0];
  }

  async getPromoCodeByCode(code: string): Promise<schema.PromoCode | undefined> {
    const result = await db.select().from(schema.promoCodes)
      .where(and(
        eq(schema.promoCodes.code, code),
        eq(schema.promoCodes.isActive, 1)
      ));
    return result[0];
  }

  async createPromoCode(promoCode: schema.InsertPromoCode): Promise<schema.PromoCode> {
    const result = await db.insert(schema.promoCodes).values(promoCode).returning();
    if (result.length === 0) {
      throw new Error("Failed to create promo code");
    }
    return result[0];
  }

  async updatePromoCode(id: number, promoCode: Partial<schema.InsertPromoCode>): Promise<schema.PromoCode | undefined> {
    const result = await db.update(schema.promoCodes)
      .set({ ...promoCode, updatedAt: new Date() })
      .where(eq(schema.promoCodes.id, id))
      .returning();
    return result[0];
  }

  async deletePromoCode(id: number): Promise<boolean> {
    const result = await db.delete(schema.promoCodes).where(eq(schema.promoCodes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // RECEIPTS
  async getReceipts(): Promise<schema.Receipt[]> {
    return await db.select().from(schema.receipts).orderBy(desc(schema.receipts.createdAt));
  }

  async getReceiptByOrderId(orderId: number): Promise<schema.Receipt | undefined> {
    const result = await db.select().from(schema.receipts).where(eq(schema.receipts.orderId, orderId));
    return result[0];
  }

  async createReceipt(receipt: schema.InsertReceipt): Promise<schema.Receipt> {
    const result = await db.insert(schema.receipts).values(receipt).returning();
    if (result.length === 0) {
      throw new Error("Failed to create receipt");
    }
    return result[0];
  }

  // ADMIN MODULE PERMISSIONS
  async getAdminModules(): Promise<schema.AdminModule[]> {
    return await db.select().from(schema.adminModules).orderBy(asc(schema.adminModules.name));
  }

  async getAdminModulePermissions(adminUserId: number): Promise<schema.AdminModulePermission[]> {
    return await db.select().from(schema.adminModulePermissions)
      .where(eq(schema.adminModulePermissions.adminUserId, adminUserId));
  }

  async createAdminModulePermission(permission: schema.InsertAdminModulePermission): Promise<schema.AdminModulePermission> {
    const result = await db.insert(schema.adminModulePermissions).values(permission).returning();
    if (result.length === 0) {
      throw new Error("Failed to create admin module permission");
    }
    return result[0];
  }

  async updateAdminModulePermission(id: number, permission: Partial<schema.InsertAdminModulePermission>): Promise<schema.AdminModulePermission | undefined> {
    const result = await db.update(schema.adminModulePermissions)
      .set({ ...permission, updatedAt: new Date() })
      .where(eq(schema.adminModulePermissions.id, id))
      .returning();
    return result[0];
  }

  async updateUserPermissions(userId: number, permissions: any[]): Promise<boolean> {
    try {
      // Delete existing permissions
      await db.delete(schema.adminModulePermissions)
        .where(eq(schema.adminModulePermissions.adminUserId, userId));
      
      // Insert new permissions
      if (permissions && permissions.length > 0) {
        await db.insert(schema.adminModulePermissions).values(
          permissions.map((perm: any) => ({
            adminUserId: userId,
            moduleId: perm.moduleId,
            canView: perm.canView || 0,
            canCreate: perm.canCreate || 0,
            canEdit: perm.canEdit || 0,
            canDelete: perm.canDelete || 0,
          }))
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user permissions:', error);
      return false;
    }
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  async createNotification(notification: schema.InsertNotification): Promise<schema.Notification> {
    const result = await db.insert(schema.notifications).values(notification).returning();
    return result[0];
  }

  async getNotifications(recipientType: 'admin' | 'customer', recipientId?: number): Promise<schema.Notification[]> {
    if (recipientId) {
      return await db.select().from(schema.notifications)
        .where(and(
          eq(schema.notifications.recipientType, recipientType),
          eq(schema.notifications.recipientId, recipientId)
        ))
        .orderBy(desc(schema.notifications.createdAt));
    }
    return await db.select().from(schema.notifications)
      .where(eq(schema.notifications.recipientType, recipientType))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(schema.notifications)
      .set({ isRead: 1 })
      .where(eq(schema.notifications.id, id));
  }

  async markAllNotificationsAsRead(recipientType: 'admin' | 'customer', recipientId?: number): Promise<void> {
    if (recipientId) {
      await db.update(schema.notifications)
        .set({ isRead: 1 })
        .where(and(
          eq(schema.notifications.recipientType, recipientType),
          eq(schema.notifications.recipientId, recipientId)
        ));
    } else {
      await db.update(schema.notifications)
        .set({ isRead: 1 })
        .where(eq(schema.notifications.recipientType, recipientType));
    }
  }

}

export const storage = new MySQLStorage();
