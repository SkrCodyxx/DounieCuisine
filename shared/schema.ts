import { sql } from "drizzle-orm";
import { pgTable, serial, integer, varchar, text, numeric, decimal, timestamp, boolean, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Utility function to generate random DC-IDs (guaranteed unique)
export function generateDcId(prefix: string = "DC"): string {
  // Generate random 6-digit number + timestamp to ensure uniqueness
  const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6 digits: 100000-999999
  const timestamp = Date.now().toString().slice(-4); // last 4 digits of timestamp
  return `${prefix}-${randomNum}${timestamp}`;
}

// Admin Users - Simplified (no permissions system)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"), // "super_admin" or "admin"
  lastLogin: timestamp("last_login"),
  lastActivity: timestamp("last_activity"), // Pour tracking d'inactivité (sécurité)
  active: integer("active").notNull().default(1),
  createdBy: integer("created_by"), // ID of admin who created this user
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdminUserSchema = z.object({
  username: z.string().min(1).max(50),
  email: z.string().email().max(100),
  password: z.string().min(6).max(255),
  role: z.string().optional().default("admin"),
  lastLogin: z.date().optional().nullable(),
  active: z.number().optional().default(1),
  createdBy: z.number().optional().nullable(),
});
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Admin Modules - Define available admin pages/modules
export const adminModules = pgTable("admin_modules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AdminModule = typeof adminModules.$inferSelect;

// Admin Module Permissions - Link admins to their permissions on each module
export const adminModulePermissions = pgTable("admin_module_permissions", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").notNull().references(() => adminModules.id, { onDelete: "cascade" }),
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminModulePermissionSchema = z.object({
  adminUserId: z.number(),
  moduleId: z.number(),
  canView: z.boolean().optional().default(false),
  canCreate: z.boolean().optional().default(false),
  canEdit: z.boolean().optional().default(false),
  canDelete: z.boolean().optional().default(false),
});

export type InsertAdminModulePermission = z.infer<typeof insertAdminModulePermissionSchema>;
export type AdminModulePermission = typeof adminModulePermissions.$inferSelect;

// Types pour les variantes flexibles (nouvelle table dish_variants_new)
export type DishVariant = {
  id: number;
  dishId: number;
  label: string; // Custom label: "Petit", "Grand", "Sans Sauce", etc.
  price: string | number;
  displayOrder?: number;
  isDefault?: number;
  isActive?: number;
  createdAt?: string;
  updatedAt?: string;
};

// Dishes
export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }), // Prix de base si pas de variants
  hasVariants: integer("has_variants").notNull().default(0), // Flag pour indiquer si le plat a des variantes
  category: varchar("category", { length: 50 }).notNull(),
  imageId: integer("image_id").references(() => mediaAssets.id), // Reference to uploaded image
  ingredients: text("ingredients"),
  allergens: varchar("allergens", { length: 200 }),
  spiceLevel: varchar("spice_level", { length: 20 }).default("moyen"),
  available: integer("available").notNull().default(1),
  featured: integer("featured").notNull().default(0),
  isTakeout: integer("is_takeout").notNull().default(0),
  isCatering: integer("is_catering").notNull().default(0),
  preparationTime: integer("preparation_time").default(30),
  displayOrder: integer("display_order").default(0),
  // New columns for status management
  status: varchar("status", { length: 20 }).notNull().default("available"), // available, out_of_stock, coming_soon
  isActive: integer("is_active").notNull().default(1), // Can toggle on/off from admin
  sectionId: integer("section_id"), // Link to menu_sections table
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Define the variant schema first
export const insertDishSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  price: z.string().optional().nullable().transform(val => {
    // Convert empty string to null for numeric DB column
    if (val === "" || val === null || val === undefined) return null;
    return val;
  }),
  hasVariants: z.number().optional().default(0),
  category: z.string().min(1).max(50),
  imageId: z.number().optional().nullable(), // Reference to uploaded image
  ingredients: z.string().optional().nullable(),
  allergens: z.string().max(200).optional().nullable(),
  spiceLevel: z.string().default("moyen"),
  available: z.number().optional().default(1),
  featured: z.number().optional().default(0),
  isTakeout: z.number().optional().default(0),
  isCatering: z.number().optional().default(0),
  preparationTime: z.number().optional().default(30),
  displayOrder: z.number().optional().default(0),
  status: z.enum(["available", "limited_stock", "out_of_stock"]).optional().default("available"),
  isActive: z.number().optional().default(1),
  sectionId: z.number().optional().nullable(),
});
export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishes.$inferSelect;

// New flexible dish variants table - allows unlimited custom variants per dish
export const dishVariantsNew = pgTable("dish_variants_new", {
  id: serial("id").primaryKey(),
  dishId: integer("dish_id").notNull().references(() => dishes.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }).notNull(), // e.g., "Petit", "Grand", "Sans Sauce"
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isDefault: integer("is_default").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  sql`UNIQUE (${table.dishId}, ${table.label})`,
]);

export const insertDishVariantSchema = z.object({
  dishId: z.number().min(1),
  label: z.string().min(1).max(100),
  price: z.string().or(z.number()).transform(val => String(val)),
  displayOrder: z.number().optional().default(0),
  isDefault: z.number().optional().default(0),
  isActive: z.number().optional().default(1),
});
export type InsertDishVariant = z.infer<typeof insertDishVariantSchema>;
export type DishVariantNew = typeof dishVariantsNew.$inferSelect;

// Sides (Accompagnements) - Table des accompagnements disponibles
export const sides = pgTable("sides", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  category: varchar("category", { length: 50 }).default("accompagnement"),
  allergens: text("allergens"), // JSON string of allergen IDs
  isActive: integer("is_active").notNull().default(1),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSideSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  price: z.string().or(z.number()).transform(val => String(val)),
  category: z.string().max(50).optional().default("accompagnement"),
  allergens: z.string().optional().nullable(),
  isActive: z.number().optional().default(1),
  displayOrder: z.number().optional().default(0),
});
export type InsertSide = z.infer<typeof insertSideSchema>;
export type Side = typeof sides.$inferSelect;

// Dish Sides (Relations plat-accompagnement)
export const dishSides = pgTable("dish_sides", {
  id: serial("id").primaryKey(),
  dishId: integer("dish_id").notNull().references(() => dishes.id, { onDelete: "cascade" }),
  sideId: integer("side_id").notNull().references(() => sides.id, { onDelete: "cascade" }),
  isIncluded: integer("is_included").notNull().default(0), // 1 = inclus gratuitement, 0 = supplément
  extraPrice: numeric("extra_price", { precision: 10, scale: 2 }).default("0.00"), // Prix supplémentaire si applicable
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  sql`UNIQUE (${table.dishId}, ${table.sideId})`,
]);

export const insertDishSideSchema = z.object({
  dishId: z.number(),
  sideId: z.number(),
  isIncluded: z.number().optional().default(0),
  extraPrice: z.string().or(z.number()).optional().transform(val => val ? String(val) : "0.00"),
  displayOrder: z.number().optional().default(0),
});
export type InsertDishSide = z.infer<typeof insertDishSideSchema>;
export type DishSide = typeof dishSides.$inferSelect;

// Dish Categories - Catégories personnalisables pour plats takeout
export const dishCategories = pgTable("dish_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(1),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDishCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable().transform(val => val === "" ? null : val),
  displayOrder: z.number().optional().default(1),
  isActive: z.number().optional().default(1),
});
export type InsertDishCategory = z.infer<typeof insertDishCategorySchema>;
export type DishCategory = typeof dishCategories.$inferSelect;

// Customer data is now stored directly in orders/bookings (no separate accounts)

// Customer schemas removed - customer data is now embedded in orders

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  dcId: varchar("dc_id", { length: 20 }).unique(),
  orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerEmail: varchar("customer_email", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentProvider: varchar("payment_provider", { length: 50 }), // "square", "cash", "other"
  paymentId: varchar("payment_id", { length: 255 }), // Square payment ID
  transactionId: varchar("transaction_id", { length: 100 }),
  paidAt: timestamp("paid_at"), // Timestamp when payment was completed
  orderType: varchar("order_type", { length: 50 }).notNull(),
  deliveryDate: timestamp("delivery_date"),
  deliveryTime: varchar("delivery_time", { length: 10 }),
  deliveryAddress: text("delivery_address"),
  deliveryApartment: varchar("delivery_apartment", { length: 20 }), // Appartement de livraison
  specialInstructions: text("special_instructions"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = z.object({
  dcId: z.string().max(20).optional().nullable(),
  orderNumber: z.string().max(20),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email().max(100),
  customerPhone: z.string().max(20).optional().nullable(),
  totalAmount: z.string(),
  taxAmount: z.string().optional().default("0"),
  deliveryFee: z.string().optional().default("0"),
  status: z.string().default("pending"),
  paymentStatus: z.string().default("pending"),
  paymentMethod: z.string().max(50).optional().nullable(),
  paymentProvider: z.string().max(50).optional().nullable(),
  paymentId: z.string().max(255).optional().nullable(),
  transactionId: z.string().max(100).optional().nullable(),
  paidAt: z.date().optional().nullable(),
  orderType: z.string().min(1).max(50),
  deliveryDate: z.date().optional().nullable(),
  deliveryTime: z.string().max(10).optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  deliveryApartment: z.string().max(20).optional().nullable(), // Appartement de livraison
  specialInstructions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order Items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  dishId: integer("dish_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  specialRequests: text("special_requests"),
});

export const insertOrderItemSchema = z.object({
  orderId: z.number(),
  dishId: z.number(),
  quantity: z.number().min(1),
  unitPrice: z.string(),
  specialRequests: z.string().optional().nullable(),
});
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Activity Blog Posts (formerly Events)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  description: text("description"), // Description longue
  content: text("content"), // Contenu principal du post
  shortExcerpt: text("short_excerpt"), // Extrait court pour listes
  
  // Dates et timing
  activityDate: timestamp("activity_date"), // Date de l'activité (optionnelle)
  publishedAt: timestamp("published_at").defaultNow(),
  
  // Localisation
  location: varchar("location", { length: 200 }),
  address: text("address"),
  
  // Médias
  imageId: integer("image_id").references(() => mediaAssets.id), // Image principale
  mediaAttachments: json("media_attachments"), // Anciennement galleryImages
  mediaGallery: json("media_gallery"), // Galerie de médias étendue
  
  // Métadonnées du post
  postType: varchar("post_type", { length: 50 }).default("activity"), // activity, announcement, promotion, menu_update, opening_hours, special_event
  category: varchar("category", { length: 50 }).default("general"),
  status: varchar("status", { length: 50 }).default("upcoming"),
  
  // Prix et réservations
  price: numeric("price", { precision: 10, scale: 2 }),
  isFree: boolean("is_free"),
  maxParticipants: integer("max_participants"), // Nombre max de participants
  currentReservations: integer("current_reservations").default(0), // Réservations actuelles
  requiresReservation: boolean("requires_reservation").default(false), // Nécessite réservation
  reservationDeadline: timestamp("reservation_deadline"), // Date limite réservation
  ticketTypes: json("ticket_types"), // Types de billets/places
  contactInfo: text("contact_info"),
  
  // Gestion du blog
  featured: integer("featured").notNull().default(0),
  isPinned: boolean("is_pinned").default(false), // Épinglé en haut
  isPublished: boolean("is_published").default(true),
  authorId: integer("author_id"), // ID de l'admin auteur
  engagementStats: json("engagement_stats"), // Stats de vues, etc.
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEventSchema = z.object({
  title: z.string().min(1).max(150),
  slug: z.string().min(1).max(150),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  shortExcerpt: z.string().optional().nullable(),
  
  // Dates
  activityDate: z.coerce.date().optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
  
  // Localisation
  location: z.string().max(200).optional().nullable(),
  address: z.string().optional().nullable(),
  
  // Médias
  imageId: z.number().optional().nullable(),
  mediaAttachments: z.any().optional().nullable(),
  mediaGallery: z.any().optional().nullable(),
  
  // Métadonnées
  postType: z.enum(["activity", "announcement", "promotion", "menu_update", "opening_hours", "special_event"]).default("activity"),
  category: z.string().default("general"),
  status: z.string().default("upcoming"),
  
  // Prix et réservations
  price: z.string().optional().nullable(),
  isFree: z.boolean().optional().nullable(),
  maxParticipants: z.number().optional().nullable(),
  currentReservations: z.number().optional().default(0),
  requiresReservation: z.boolean().optional().default(false),
  reservationDeadline: z.coerce.date().optional().nullable(),
  ticketTypes: z.any().optional().nullable(),
  contactInfo: z.string().optional().nullable(),
  
  // Gestion blog
  featured: z.number().optional().default(0),
  isPinned: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
  authorId: z.number().optional().nullable(),
  engagementStats: z.any().optional().nullable(),
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event Bookings - Customer-initiated catering event reservations
export const eventBookings = pgTable("event_bookings", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id"), // Optional link to existing events (null for custom events)
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerEmail: varchar("customer_email", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  eventDate: timestamp("event_date").notNull(),
  eventTime: varchar("event_time", { length: 10 }).notNull(), // "14:30"
  guestsCount: integer("guests_count").notNull(),
  menuType: varchar("menu_type", { length: 100 }), // "Buffet Haïtien", "Menu Dégustation"
  location: text("location"), // Event address
  specialRequests: text("special_requests"),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),
  totalEstimate: numeric("total_estimate", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, cancelled, completed
  adminNotes: text("admin_notes"),
  confirmedByAdminId: integer("confirmed_by_admin_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEventBookingSchema = z.object({
  eventId: z.number().optional().nullable(),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email().max(100),
  customerPhone: z.string().min(1).max(20),
  eventDate: z.string().pipe(z.coerce.date()),
  eventTime: z.string().min(1).max(10),
  guestsCount: z.number().min(1),
  menuType: z.string().max(100).optional().nullable(),
  location: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
  depositAmount: z.string().optional().nullable(),
  totalEstimate: z.string().optional().nullable(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).default("pending"),
  adminNotes: z.string().optional().nullable(),
  confirmedByAdminId: z.number().optional().nullable(),
});
export type InsertEventBooking = z.infer<typeof insertEventBookingSchema>;
export type EventBooking = typeof eventBookings.$inferSelect;

// Hero Slides (for homepage carousel)
export const heroSlides = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  dcId: varchar("dc_id", { length: 20 }).notNull().unique(),
  title: varchar("title", { length: 100 }),
  mediaId: integer("media_id").references(() => mediaAssets.id).notNull(), // Reference to uploaded media - REQUIRED
  mediaType: varchar("media_type", { length: 10 }).notNull().default("image"), // 'image' or 'video'
  altText: varchar("alt_text", { length: 200 }),
  textContent: text("text_content"), // Overlay text content (HTML allowed)
  textPosition: varchar("text_position", { length: 20 }).default("center"), // Position: top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right
  logoId: integer("logo_id").references(() => mediaAssets.id), // Reference to uploaded logo
  logoSize: varchar("logo_size", { length: 20 }).default("medium"), // Logo size: small, medium, large
  logoVisible: integer("logo_visible").notNull().default(1), // 1 = afficher le logo, 0 = masquer
  displayOrder: integer("display_order").default(0),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHeroSlideSchema = z.object({
  dcId: z.string().max(20),
  title: z.string().max(100).optional().nullable(),
  mediaId: z.number().min(1, "Une image ou vidéo uploadée est requise"), // Reference to media_assets table - REQUIRED
  mediaType: z.enum(["image", "video"]).default("image"),
  altText: z.string().max(200).optional().nullable(),
  textContent: z.string().optional().nullable(),
  textPosition: z.enum(["top-left", "top-center", "top-right", "center-left", "center", "center-right", "bottom-left", "bottom-center", "bottom-right"]).default("center"),
  logoId: z.number().optional().nullable(), // Reference to media_assets table for logo
  logoSize: z.enum(["small", "medium", "large"]).default("medium"),
  logoVisible: z.number().optional().default(1),
  displayOrder: z.number().optional().default(0),
  active: z.number().optional().default(1),
});
export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;
export type HeroSlide = typeof heroSlides.$inferSelect;

// Gallery
export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  mediaId: integer("media_id").references(() => mediaAssets.id).notNull(), // Reference to uploaded media - REQUIRED
  thumbnailId: integer("thumbnail_id").references(() => mediaAssets.id), // Reference to uploaded thumbnail
  description: text("description"),
  category: varchar("category", { length: 50 }).default("plats"),
  displayOrder: integer("display_order").default(0),
  active: integer("active").notNull().default(1),
  featured: integer("featured").notNull().default(0),
  altText: varchar("alt_text", { length: 200 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGallerySchema = z.object({
  title: z.string().min(1).max(100),
  type: z.string().min(1).max(20),
  mediaId: z.number().min(1, "Une image ou vidéo uploadée est requise"), // Reference to uploaded media - REQUIRED
  thumbnailId: z.number().optional().nullable(), // Reference to uploaded thumbnail
  description: z.string().optional().nullable(),
  category: z.string().default("plats"),
  displayOrder: z.number().optional().default(0),
  active: z.number().optional().default(1),
  featured: z.number().optional().default(0),
  altText: z.string().max(200).optional().nullable(),
});
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Gallery = typeof gallery.$inferSelect;

// Gallery Albums - Nouveau système d'albums/événements
export const galleryAlbums = pgTable("gallery_albums", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  eventDate: timestamp("event_date"),
  location: varchar("location", { length: 100 }),
  coverImageId: integer("cover_image_id").references(() => mediaAssets.id),
  category: varchar("category", { length: 50 }).default("événements"),
  displayOrder: integer("display_order").default(0),
  isActive: integer("is_active").notNull().default(1),
  isFeatured: integer("is_featured").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGalleryAlbumSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().optional().nullable(),
  eventDate: z.date().optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  coverImageId: z.number().optional().nullable(),
  category: z.string().default("événements"),
  displayOrder: z.number().optional().default(0),
  isActive: z.number().optional().default(1),
  isFeatured: z.number().optional().default(0),
});
export type InsertGalleryAlbum = z.infer<typeof insertGalleryAlbumSchema>;
export type GalleryAlbum = typeof galleryAlbums.$inferSelect;

// Gallery Photos - Photos dans les albums
export const galleryPhotos = pgTable("gallery_photos", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull().references(() => galleryAlbums.id, { onDelete: "cascade" }),
  mediaId: integer("media_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGalleryPhotoSchema = z.object({
  albumId: z.number(),
  mediaId: z.number(),
  title: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  displayOrder: z.number().optional().default(0),
  isActive: z.number().optional().default(1),
});
export type InsertGalleryPhoto = z.infer<typeof insertGalleryPhotoSchema>;
export type GalleryPhoto = typeof galleryPhotos.$inferSelect;

// Testimonials
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 100 }).notNull(),
  clientPhotoId: integer("client_photo_id").references(() => mediaAssets.id), // Reference to uploaded photo
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  eventType: varchar("event_type", { length: 50 }),
  eventDate: timestamp("event_date"),
  location: varchar("location", { length: 100 }),
  featured: integer("featured").notNull().default(0),
  approved: integer("approved").notNull().default(0),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  customerName: varchar("customer_name", { length: 100 }),
  customerEmail: varchar("customer_email", { length: 100 }),
});

export const insertTestimonialSchema = z.object({
  clientName: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(100).optional(), // Alias pour clientName
  clientPhotoId: z.number().optional().nullable(), // Reference to uploaded photo
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
  eventType: z.string().max(50).optional().nullable(),
  eventDate: z.date().optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  featured: z.number().optional().default(0),
  approved: z.number().optional().default(0),
  displayOrder: z.number().optional().default(0),
}).refine(data => data.clientName || data.name, {
  message: "Nom du client requis (clientName ou name)"
});
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

// Contact Messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 150 }),
  message: text("message").notNull(),
  inquiryType: varchar("inquiry_type", { length: 50 }).default("general"),
  status: varchar("status", { length: 20 }).default("new"),
  adminNotes: text("admin_notes"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactMessageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  phone: z.string().max(20).optional().nullable(),
  subject: z.string().max(150).optional().nullable(),
  message: z.string().min(1),
  inquiryType: z.string().min(1, "Le type de demande est requis"),
  status: z.string().default("new"),
  adminNotes: z.string().optional().nullable(),
  repliedAt: z.date().optional().nullable(),
});
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageId: integer("image_id"),
  active: integer("active").notNull().default(1),
  featured: integer("featured").notNull().default(0),
  priority: varchar("priority", { length: 20 }).default("normal"),
  expiresAt: timestamp("expires_at"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAnnouncementSchema = z.object({
  title: z.string().min(1).max(150),
  slug: z.string().min(1).max(150),
  content: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  imageId: z.number().optional().nullable(),
  active: z.number().optional().default(1),
  featured: z.number().optional().default(0),
  priority: z.string().default("normal"),
  expiresAt: z.date().optional().nullable(),
  viewCount: z.number().optional().default(0),
});
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// Site Settings (key-value pairs - kept for backwards compatibility)
// Site Info (structured settings for contact info and business details)
export const siteInfo = pgTable("site_info", {
  id: serial("id").primaryKey(),
  businessName: varchar("business_name", { length: 100 }).notNull(),
  companyName: varchar("company_name", { length: 255 }),
  tagline: varchar("tagline", { length: 200 }),
  description: text("description"),
  logoId: integer("logo_id"), // Reference to media_assets table
  // Control whether the logo is shown in the public hero/header
  logoVisible: integer("logo_visible").default(1),
  
  // Multiple phones (up to 3)
  phone1: varchar("phone1", { length: 20 }),
  phone1Label: varchar("phone1_label", { length: 50 }).default("Principal"),
  phone2: varchar("phone2", { length: 20 }),
  phone2Label: varchar("phone2_label", { length: 50 }).default("Secondaire"),
  phone3: varchar("phone3", { length: 20 }),
  phone3Label: varchar("phone3_label", { length: 50 }).default("Autre"),
  whatsappNumber: varchar("whatsapp_number", { length: 50 }),
  
  // Multiple emails (primary and secondary)
  emailPrimary: varchar("email_primary", { length: 100 }),
  emailSecondary: varchar("email_secondary", { length: 100 }),
  emailSupport: varchar("email_support", { length: 100 }),
  
  // Business address
  address: text("address"),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 50 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 50 }).default("Canada"),
  
  // Business hours
  businessHours: json("business_hours"),
  
  // Tax rates
  tpsRate: numeric("tps_rate", { precision: 5, scale: 3 }).default("0.050"),
  tvqRate: numeric("tvq_rate", { precision: 5, scale: 4 }).default("0.09975"),
  
  // Delivery radius (zones de livraison gèrent les prix)
  deliveryRadiusKm: numeric("delivery_radius_km", { precision: 10, scale: 2 }).default("15.00"),
  
  // Website Settings
  siteUrl: varchar("site_url", { length: 255 }),
  adminUrl: varchar("admin_url", { length: 255 }),
  
  // Social Media URLs
  facebookUrl: varchar("facebook_url", { length: 255 }),
  instagramUrl: varchar("instagram_url", { length: 255 }),
  youtubeUrl: varchar("youtube_url", { length: 255 }),
  twitterUrl: varchar("twitter_url", { length: 255 }),
  linkedinUrl: varchar("linkedin_url", { length: 255 }),
  
  // SEO & Meta
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  
  // Configuration
  timezone: varchar("timezone", { length: 100 }).default("America/Toronto"),
  maintenanceMode: boolean("maintenance_mode").default(false),
  onlineOrderingEnabled: boolean("online_ordering_enabled").default(true),
  reservationsEnabled: boolean("reservations_enabled").default(true),
  newsletterEnabled: boolean("newsletter_enabled").default(true),
  
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteInfoSchema = z.object({
  businessName: z.string().min(1).max(100),
  companyName: z.string().max(255).optional().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().optional().nullable(),
  logoId: z.number().optional().nullable(), // Reference to media_assets table
  logoVisible: z.number().optional().default(1),
  phone1: z.string().max(20).optional().nullable(),
  phone1Label: z.string().max(50).optional().default("Principal"),
  phone2: z.string().max(20).optional().nullable(),
  phone2Label: z.string().max(50).optional().default("Secondaire"),
  phone3: z.string().max(20).optional().nullable(),
  phone3Label: z.string().max(50).optional().default("Autre"),
  whatsappNumber: z.string().max(50).optional().nullable(),
  emailPrimary: z.string().email().max(100).optional().nullable(),
  emailSecondary: z.string().email().max(100).optional().nullable(),
  emailSupport: z.string().email().max(100).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(50).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(50).optional().default("Canada"),
  businessHours: z.any().optional().nullable(),
  tpsRate: z.string().optional().default("0.050"),
  tvqRate: z.string().optional().default("0.09975"),
  deliveryRadiusKm: z.string().optional().default("15.00"),
  
  // Website Settings
  siteUrl: z.string().max(255).optional().nullable(),
  adminUrl: z.string().max(255).optional().nullable(),
  
  // Social Media URLs
  facebookUrl: z.string().max(255).optional().nullable(),
  instagramUrl: z.string().max(255).optional().nullable(),
  youtubeUrl: z.string().max(255).optional().nullable(),
  twitterUrl: z.string().max(255).optional().nullable(),
  linkedinUrl: z.string().max(255).optional().nullable(),
  
  // SEO & Meta
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  metaKeywords: z.string().optional().nullable(),
  
  // Configuration
  timezone: z.string().max(100).optional().default("America/Toronto"),
  maintenanceMode: z.boolean().optional().default(false),
  onlineOrderingEnabled: z.boolean().optional().default(true),
  reservationsEnabled: z.boolean().optional().default(true),
  newsletterEnabled: z.boolean().optional().default(true),
});
export type InsertSiteInfo = z.infer<typeof insertSiteInfoSchema>;
export type SiteInfo = typeof siteInfo.$inferSelect;

// Legal Pages (Privacy Policy, Terms of Service, etc.)
export const legalPages = pgTable("legal_pages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  meta_description: varchar("meta_description", { length: 300 }),
  active: integer("active").notNull().default(1),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLegalPageSchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  meta_description: z.string().max(300).optional().nullable(),
  active: z.number().optional().default(1),
  displayOrder: z.number().optional().default(0),
});
export type InsertLegalPage = z.infer<typeof insertLegalPageSchema>;
export type LegalPage = typeof legalPages.$inferSelect;

// Note: Old daily_menu_schedule, daily_menu_items, weekly_menus, menu_dishes, and menu_day_assignments tables
// have been removed and replaced with the new takeout menu system (see below: takeoutMenus, takeoutMenuSections, takeoutSectionDishes)


// Takeout Menus - New menu system replacing weekly/daily menus
export const takeoutMenus = pgTable("takeout_menus", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: integer("is_active").notNull().default(0), // Only one menu should be active at a time
  displayOrder: integer("display_order").default(0), // For future multi-menu support
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTakeoutMenuSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  isActive: z.number().optional().default(0),
  displayOrder: z.number().optional().default(0),
});
export type InsertTakeoutMenu = z.infer<typeof insertTakeoutMenuSchema>;
export type TakeoutMenu = typeof takeoutMenus.$inferSelect;

// Takeout Menu Sections - Sections within a menu (e.g., Entrées, Plats Principaux, Desserts)
export const takeoutMenuSections = pgTable("takeout_menu_sections", {
  id: serial("id").primaryKey(),
  menuId: integer("menu_id").notNull(), // FK to takeout_menus
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0), // Order of sections in menu
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTakeoutMenuSectionSchema = z.object({
  menuId: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  displayOrder: z.number().optional().default(0),
});
export type InsertTakeoutMenuSection = z.infer<typeof insertTakeoutMenuSectionSchema>;
export type TakeoutMenuSection = typeof takeoutMenuSections.$inferSelect;

// Takeout Section Dishes - Many-to-many relationship between sections and dishes
export const takeoutSectionDishes = pgTable("takeout_section_dishes", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull(), // FK to takeout_menu_sections
  dishId: integer("dish_id").notNull(), // FK to dishes
  displayOrder: integer("display_order").notNull().default(0), // Order of dishes in section
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTakeoutSectionDishSchema = z.object({
  sectionId: z.number(),
  dishId: z.number(),
  displayOrder: z.number().optional().default(0),
});
export type InsertTakeoutSectionDish = z.infer<typeof insertTakeoutSectionDishSchema>;
export type TakeoutSectionDish = typeof takeoutSectionDishes.$inferSelect;

// Receipts - For order receipts
export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  dcId: varchar("dc_id", { length: 20 }).notNull().unique(),
  orderId: integer("order_id").notNull(),
  orderDcId: varchar("order_dc_id", { length: 20 }).notNull(),
  receiptNumber: varchar("receipt_number", { length: 30 }).notNull().unique(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 100 }),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReceiptSchema = z.object({
  dcId: z.string().max(20),
  orderId: z.number(),
  orderDcId: z.string().max(20),
  receiptNumber: z.string().max(30),
  subtotal: z.string(),
  taxAmount: z.string(),
  deliveryFee: z.string().optional().default("0"),
  discountAmount: z.string().optional().default("0"),
  totalAmount: z.string(),
  paymentMethod: z.string().max(50).optional().nullable(),
  transactionId: z.string().max(100).optional().nullable(),
  paidAt: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;

// Note: email_templates and automated_emails tables removed - now using Mailjet with visual templates created in dashboard

// Menu Schedules - Advanced scheduling for menus with time ranges and recurrence
export const menuSchedules = pgTable("menu_schedules", {
  id: serial("id").primaryKey(),
  dcId: varchar("dc_id", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  startTime: varchar("start_time", { length: 10 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 10 }).notNull(), // HH:MM format
  daysOfWeek: json("days_of_week").notNull(), // Array: ["thursday", "friday", "saturday"]
  recurrenceType: varchar("recurrence_type", { length: 50 }).notNull().default("weekly"), // weekly, biweekly, monthly, custom
  isActive: integer("is_active").notNull().default(1),
  priority: integer("priority").default(0), // Higher priority schedules override lower ones
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMenuScheduleSchema = z.object({
  dcId: z.string().max(20),
  name: z.string().max(200),
  description: z.string().optional().nullable(),
  startTime: z.string().max(10),
  endTime: z.string().max(10),
  daysOfWeek: z.any(),
  recurrenceType: z.string().max(50).default("weekly"),
  isActive: z.number().default(1),
  priority: z.number().default(0),
});

export type InsertMenuSchedule = z.infer<typeof insertMenuScheduleSchema>;
export type MenuSchedule = typeof menuSchedules.$inferSelect;

// Scheduled Menu Items - Link dishes to menu schedules
export const scheduledMenuItems = pgTable("scheduled_menu_items", {
  id: serial("id").primaryKey(),
  menuScheduleId: integer("menu_schedule_id").notNull(), // References menu_schedules.id
  dishId: integer("dish_id").notNull(), // References dishes.id
  specialPrice: numeric("special_price", { precision: 10, scale: 2 }),
  maxQuantity: integer("max_quantity"),
  displayOrder: integer("display_order").default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScheduledMenuItemSchema = z.object({
  menuScheduleId: z.number(),
  dishId: z.number(),
  specialPrice: z.string().optional().nullable(),
  maxQuantity: z.number().optional().nullable(),
  displayOrder: z.number().default(0),
  isActive: z.number().default(1),
});

export type InsertScheduledMenuItem = z.infer<typeof insertScheduledMenuItemSchema>;
export type ScheduledMenuItem = typeof scheduledMenuItems.$inferSelect;

// ============================================================
// INTERNAL MESSAGING SYSTEM
// ============================================================

// Internal Messages - Communication between clients and admin
export const internalMessages = pgTable("internal_messages", {
  id: serial("id").primaryKey(),
  dcId: varchar("dc_id", { length: 20 }).notNull().unique(),
  fromUserId: integer("from_user_id"),
  fromUserType: varchar("from_user_type", { length: 20 }).notNull(), // admin or guest
  toUserId: integer("to_user_id"),
  toUserType: varchar("to_user_type", { length: 20 }).notNull(), // admin or guest
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  relatedOrderId: integer("related_order_id"),
  relatedQuoteId: integer("related_quote_id"),
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  status: varchar("status", { length: 20 }).default("unread"), // unread, read, archived
  readAt: timestamp("read_at"),
  repliedAt: timestamp("replied_at"),
  parentMessageId: integer("parent_message_id"), // For threading/replies
  attachments: json("attachments"), // Array of file URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInternalMessageSchema = z.object({
  dcId: z.string().max(20),
  fromUserId: z.number().optional().nullable(),
  fromUserType: z.enum(["admin", "guest"]),
  toUserId: z.number().optional().nullable(),
  toUserType: z.enum(["admin", "guest"]),
  subject: z.string().min(1).max(200),
  message: z.string().min(1),
  relatedOrderId: z.number().optional().nullable(),
  relatedQuoteId: z.number().optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  status: z.enum(["unread", "read", "archived"]).default("unread"),
  readAt: z.date().optional().nullable(),
  repliedAt: z.date().optional().nullable(),
  parentMessageId: z.number().optional().nullable(),
  attachments: z.any().optional().nullable(),
});
export type InsertInternalMessage = z.infer<typeof insertInternalMessageSchema>;
export type InternalMessage = typeof internalMessages.$inferSelect;

// ============================================================
// AUDIT TRAIL SYSTEM
// ============================================================

// Audit Logs - Comprehensive activity tracking
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userType: varchar("user_type", { length: 20 }).notNull(), // admin, customer, system
  username: varchar("username", { length: 100 }),
  action: varchar("action", { length: 100 }).notNull(), // login, logout, create, update, delete, view, export
  tableName: varchar("table_name", { length: 100 }),
  recordId: integer("record_id"),
  oldValue: json("old_value"), // Snapshot before change
  newValue: json("new_value"), // Snapshot after change
  description: text("description"), // Human-readable description
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: varchar("user_agent", { length: 500 }),
  severity: varchar("severity", { length: 20 }).default("info"), // info, warning, error, critical
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuditLogSchema = z.object({
  userId: z.number().optional().nullable(),
  userType: z.enum(["admin", "customer", "system"]),
  username: z.string().max(100).optional().nullable(),
  action: z.string().min(1).max(100),
  tableName: z.string().max(100).optional().nullable(),
  recordId: z.number().optional().nullable(),
  oldValue: z.any().optional().nullable(),
  newValue: z.any().optional().nullable(),
  description: z.string().optional().nullable(),
  ipAddress: z.string().max(50).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
  severity: z.enum(["info", "warning", "error", "critical"]).default("info"),
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// ============================================================
// ANNOUNCEMENTS & BANNERS SYSTEM
// ============================================================

// Site Banners - Top banners for announcements
export const siteBanners = pgTable("site_banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).default("info"), // info, success, warning, error, promo
  backgroundColor: varchar("background_color", { length: 50 }),
  textColor: varchar("text_color", { length: 50 }),
  linkUrl: varchar("link_url", { length: 255 }),
  linkText: varchar("link_text", { length: 100 }),
  dismissible: integer("dismissible").notNull().default(1),
  position: varchar("position", { length: 20 }).default("top"), // top, bottom
  active: integer("active").notNull().default(1),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteBannerSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  type: z.enum(["info", "success", "warning", "error", "promo"]).default("info"),
  backgroundColor: z.string().max(50).optional().nullable(),
  textColor: z.string().max(50).optional().nullable(),
  linkUrl: z.string().max(255).optional().nullable(),
  linkText: z.string().max(100).optional().nullable(),
  dismissible: z.number().optional().default(1),
  position: z.enum(["top", "bottom"]).default("top"),
  active: z.number().optional().default(1),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  displayOrder: z.number().optional().default(0),
});
export type InsertSiteBanner = z.infer<typeof insertSiteBannerSchema>;
export type SiteBanner = typeof siteBanners.$inferSelect;

// Pop-up Announcements - Modal pop-ups for important announcements
export const popupAnnouncements = pgTable("popup_announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  imageId: integer("image_id"),
  buttonText: varchar("button_text", { length: 100 }),
  buttonUrl: varchar("button_url", { length: 255 }),
  displayFrequency: varchar("display_frequency", { length: 20 }).default("once"), // once, daily, always
  targetAudience: varchar("target_audience", { length: 50 }).default("all"), // all, new_visitors, returning, logged_in
  active: integer("active").notNull().default(1),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  displayCount: integer("display_count").default(0),
  clickCount: integer("click_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPopupAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  imageId: z.number().optional().nullable(),
  buttonText: z.string().max(100).optional().nullable(),
  buttonUrl: z.string().max(255).optional().nullable(),
  displayFrequency: z.enum(["once", "daily", "always"]).default("once"),
  targetAudience: z.enum(["all", "new_visitors", "returning", "logged_in"]).default("all"),
  active: z.number().optional().default(1),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  displayCount: z.number().optional().default(0),
  clickCount: z.number().optional().default(0),
});
export type InsertPopupAnnouncement = z.infer<typeof insertPopupAnnouncementSchema>;
export type PopupAnnouncement = typeof popupAnnouncements.$inferSelect;

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  customerId: integer("customer_id"), // For customer password resets
  adminUserId: integer("admin_user_id"), // For admin password resets
  userType: varchar("user_type", { length: 20 }).notNull(), // 'customer' or 'admin'
  expiresAt: timestamp("expires_at").notNull(),
  used: integer("used").notNull().default(0), // 1 if token has been used
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPasswordResetTokenSchema = z.object({
  token: z.string().min(1).max(255),
  customerId: z.number().optional().nullable(),
  adminUserId: z.number().optional().nullable(),
  userType: z.enum(["customer", "admin"]),
  expiresAt: z.date(),
  used: z.number().optional().default(0),
});
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Messages - Internal messaging system between admin and customers
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: varchar("conversation_id", { length: 100 }).notNull(), // Format: "customer-{customerId}"
  senderId: integer("sender_id").notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull(), // 'customer' or 'admin'
  senderName: varchar("sender_name", { length: 100 }).notNull(),
  recipientId: integer("recipient_id").notNull(),
  recipientType: varchar("recipient_type", { length: 20 }).notNull(), // 'customer' or 'admin'
  subject: varchar("subject", { length: 200 }), // Optional subject for first message
  content: text("content").notNull(),
  isRead: integer("is_read").notNull().default(0),
  attachments: jsonb("attachments").$type<Array<{
    name: string;
    url: string;
    type: string;
  }>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = z.object({
  conversationId: z.string().max(100),
  senderId: z.number(),
  senderType: z.enum(["customer", "admin"]),
  senderName: z.string().min(1).max(100),
  recipientId: z.number(),
  recipientType: z.enum(["customer", "admin"]),
  subject: z.string().max(200).optional().nullable(),
  content: z.string().min(1),
  isRead: z.number().optional().default(0),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
  })).optional().nullable(),
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Conversations - Manage customer-admin conversations with open/closed status
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("open"), // 'open' or 'closed'
  unreadByCustomer: integer("unread_by_customer").notNull().default(0), // Count of unread messages by customer
  unreadByAdmin: integer("unread_by_admin").notNull().default(0), // Count of unread messages by admin
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(), // Last activity timestamp
  closedAt: timestamp("closed_at"),
  closedByAdminId: integer("closed_by_admin_id"), // ID of admin who closed conversation
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConversationSchema = z.object({
  customerId: z.number(),
  subject: z.string().min(1).max(200),
  status: z.enum(["open", "closed"]).default("open"),
  unreadByCustomer: z.number().optional().default(0),
  unreadByAdmin: z.number().optional().default(0),
  lastMessageAt: z.date().optional(),
  closedAt: z.date().optional().nullable(),
  closedByAdminId: z.number().optional().nullable(),
});
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Conversation Messages - Individual messages within a conversation
export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  message: text("message").notNull(),
  fromType: varchar("from_type", { length: 20 }).notNull(), // 'customer' or 'admin'
  fromAdminId: integer("from_admin_id"), // ID of admin who sent message (null if customer)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConversationMessageSchema = z.object({
  conversationId: z.number(),
  message: z.string().min(1),
  fromType: z.enum(["customer", "admin"]),
  fromAdminId: z.number().optional().nullable(),
});
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
export type ConversationMessage = typeof conversationMessages.$inferSelect;

// Menu Sections - Organize menu items (Entrées, Plats, Boissons, Desserts)
export const menuSections = pgTable("menu_sections", {
  id: serial("id").primaryKey(),
  nameFr: varchar("name_fr", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // entree, plat, boisson, dessert
  colorHex: varchar("color_hex", { length: 7 }).default("#E85D04"), // Color for UI display
  iconName: varchar("icon_name", { length: 50 }), // Lucide icon name
  isActive: integer("is_active").notNull().default(1),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMenuSectionSchema = z.object({
  nameFr: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  colorHex: z.string().max(7).default("#E85D04"),
  iconName: z.string().max(50).optional().nullable(),
  isActive: z.number().optional().default(1),
  displayOrder: z.number().optional().default(0),
});
export type InsertMenuSection = z.infer<typeof insertMenuSectionSchema>;
export type MenuSection = typeof menuSections.$inferSelect;

// Catering Categories - Catégories personnalisables avec ordre
export const cateringCategories = pgTable("catering_categories", {
  id: serial("id").primaryKey(),
  nameFr: varchar("name_fr", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  descriptionFr: text("description_fr"),
  descriptionEn: text("description_en"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCateringCategorySchema = z.object({
  nameFr: z.string().min(1).max(100),
  nameEn: z.string().max(100).optional().nullable().transform(val => val === "" ? null : val),
  descriptionFr: z.string().optional().nullable().transform(val => val === "" ? null : val),
  descriptionEn: z.string().optional().nullable().transform(val => val === "" ? null : val),
  displayOrder: z.number().optional().default(1),
  isActive: z.number().optional().default(1),
});
export type InsertCateringCategory = z.infer<typeof insertCateringCategorySchema>;
export type CateringCategory = typeof cateringCategories.$inferSelect;

// Catering Items - Items de menu avec support multi-prix
export const cateringItems = pgTable("catering_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  nameFr: varchar("name_fr", { length: 150 }).notNull(),
  nameEn: varchar("name_en", { length: 150 }).notNull(),
  descriptionFr: text("description_fr"),
  descriptionEn: text("description_en"),
  imageId: integer("image_id"), // Reference to media_assets table
  displayOrder: integer("display_order").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCateringItemSchema = z.object({
  categoryId: z.number().min(1),
  nameFr: z.string().min(1).max(150),
  nameEn: z.string().max(150).optional().nullable().transform(val => val === "" ? null : val),
  descriptionFr: z.string().optional().nullable().transform(val => val === "" ? null : val),
  descriptionEn: z.string().optional().nullable().transform(val => val === "" ? null : val),
  imageId: z.number().optional().nullable(),
  displayOrder: z.number().optional().default(1),
  isActive: z.number().optional().default(1),
});
export type InsertCateringItem = z.infer<typeof insertCateringItemSchema>;
export type CateringItem = typeof cateringItems.$inferSelect;

// Catering Item Prices - Prix multiples pour chaque item (petit/grand, unitaire, etc.)
export const cateringItemPrices = pgTable("catering_item_prices", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  sizeLabelFr: varchar("size_label_fr", { length: 50 }).notNull(),
  sizeLabelEn: varchar("size_label_en", { length: 50 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isDefault: integer("is_default").notNull().default(0),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCateringItemPriceSchema = z.object({
  itemId: z.number().min(1),
  sizeLabelFr: z.string().min(1).max(50),
  sizeLabelEn: z.string().max(50).optional().nullable().transform(val => val === "" ? null : val),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Prix invalide (ex: 25.99)"), // Decimal as string for precision
  isDefault: z.number().optional().default(1),
  displayOrder: z.number().optional().default(1),
});
export type InsertCateringItemPrice = z.infer<typeof insertCateringItemPriceSchema>;
export type CateringItemPrice = typeof cateringItemPrices.$inferSelect;

// Legacy table - DEPRECATED - Use new system above
export const cateringMenuItems = pgTable("catering_menu_items", {
  id: serial("id").primaryKey(),
  nameFr: varchar("name_fr", { length: 150 }).notNull(),
  nameEn: varchar("name_en", { length: 150 }).notNull(),
  descriptionFr: text("description_fr"),
  descriptionEn: text("description_en"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Entrées, Plats Principaux, Desserts, Boissons
  imageId: integer("image_id"), // Reference to media_assets table
  displayOrder: integer("display_order").default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCateringMenuItemSchema = z.object({
  nameFr: z.string().min(1).max(150),
  nameEn: z.string().min(1).max(150),
  descriptionFr: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  price: z.string().min(0), // Decimal as string for precision
  category: z.string().min(1).max(100),
  imageId: z.number().optional().nullable(), // Reference to media_assets table
  displayOrder: z.number().optional().default(0),
  isActive: z.number().optional().default(1),
});
export type InsertCateringMenuItem = z.infer<typeof insertCateringMenuItemSchema>;
export type CateringMenuItem = typeof cateringMenuItems.$inferSelect;

// Catering Decorative Images - Photos décoratives pour page catering (changeable admin)
export const cateringDecorativeImages = pgTable("catering_decorative_images", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id"), // Reference to media_assets table
  position: varchar("position", { length: 20 }).notNull().default("random"), // top-left, top-right, bottom-left, bottom-right, random
  displayOrder: integer("display_order").default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCateringDecorativeImageSchema = z.object({
  imageId: z.number().optional().nullable(), // Reference to media_assets table
  position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right", "random"]).default("random"),
  displayOrder: z.number().optional().default(0),
  isActive: z.number().optional().default(1),
});
export type InsertCateringDecorativeImage = z.infer<typeof insertCateringDecorativeImageSchema>;
export type CateringDecorativeImage = typeof cateringDecorativeImages.$inferSelect;

// Reviews - Customer reviews for dishes with moderation
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  orderId: integer("order_id"),
  dishId: integer("dish_id"),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  photos: jsonb("photos").$type<string[]>(), // Array of image URLs
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  moderatedByAdminId: integer("moderated_by_admin_id"),
  moderationNote: text("moderation_note"),
  isPublic: integer("is_public").notNull().default(0), // Display on public site
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReviewSchema = z.object({
  customerId: z.number(),
  customerName: z.string().min(1).max(100),
  orderId: z.number().optional().nullable(),
  dishId: z.number().optional().nullable(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  moderatedByAdminId: z.number().optional().nullable(),
  moderationNote: z.string().optional().nullable(),
  isPublic: z.number().optional().default(0),
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Promo Codes - Discount codes for customers
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // percentage, fixed, free_shipping
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  maxDiscount: numeric("max_discount", { precision: 10, scale: 2 }), // Max discount for percentage type
  usageLimit: integer("usage_limit"), // null = unlimited
  usedCount: integer("used_count").default(0),
  expiryDate: timestamp("expiry_date"),
  isActive: integer("is_active").notNull().default(1),
  description: text("description"),
  createdByAdminId: integer("created_by_admin_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPromoCodeSchema = z.object({
  code: z.string().min(1).max(50),
  discountType: z.enum(["percentage", "fixed", "free_shipping"]),
  discountValue: z.string(),
  minOrderAmount: z.string().default("0"),
  maxDiscount: z.string().optional().nullable(),
  usageLimit: z.number().optional().nullable(),
  usedCount: z.number().optional().default(0),
  expiryDate: z.date().optional().nullable(),
  isActive: z.number().optional().default(1),
  description: z.string().optional().nullable(),
  createdByAdminId: z.number().optional().nullable(),
});
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;



// Delivery Zones - Define delivery pricing based on distance ranges
export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  zoneName: varchar("zone_name", { length: 100 }).notNull(),
  distanceMinKm: decimal("distance_min_km", { precision: 5, scale: 2 }).notNull().default("0"),
  distanceMaxKm: decimal("distance_max_km", { precision: 5, scale: 2 }).notNull(),
  deliveryPrice: decimal("delivery_price", { precision: 10, scale: 2 }).notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeliveryZoneSchema = z.object({
  zoneName: z.string().min(1).max(100),
  distanceMinKm: z.string().optional().default("0"),
  distanceMaxKm: z.string().min(1),
  deliveryPrice: z.string().min(1),
  isActive: z.number().optional().default(1),
});
export type InsertDeliveryZone = z.infer<typeof insertDeliveryZoneSchema>;
export type DeliveryZone = typeof deliveryZones.$inferSelect;

// Media Assets - Store images in PostgreSQL instead of filesystem
export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  byteLength: integer("byte_length").notNull(),
  checksum: varchar("checksum", { length: 64 }), // SHA-256 hash for integrity
  data: text("data").notNull(), // Base64 encoded image data
  externalUrl: varchar("external_url", { length: 500 }), // Optional HTTPS URL for external images
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMediaAssetSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  byteLength: z.number().min(1),
  checksum: z.string().max(64).optional().nullable(),
  data: z.string().min(1), // Base64 encoded
  externalUrl: z.string().max(500).optional().nullable(),
});
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type MediaAsset = typeof mediaAssets.$inferSelect;





// Catering Quotes - Demandes de devis traiteur
export const cateringQuotes = pgTable("catering_quotes", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  guestCount: integer("guest_count").notNull(),
  eventDate: timestamp("event_date"),
  eventTime: varchar("event_time", { length: 10 }),
  location: varchar("location", { length: 200 }),
  budgetRange: varchar("budget_range", { length: 50 }),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerEmail: varchar("customer_email", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  message: text("message"),
  selectedItems: jsonb("selected_items"), // Plats sélectionnés via configurateur
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, reviewed, quoted, confirmed, cancelled
  adminNotes: text("admin_notes"),
  quoteSentAt: timestamp("quote_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCateringQuoteSchema = z.object({
  eventType: z.string().min(1).max(50),
  guestCount: z.number().min(1),
  eventDate: z.string().optional().nullable(),
  eventTime: z.string().max(10).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  budgetRange: z.string().max(50).optional().nullable(),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email().max(100),
  customerPhone: z.string().min(1).max(20),
  message: z.string().optional().nullable(),
  selectedItems: z.any().optional().nullable(), // JSONB
  estimatedPrice: z.number().optional().nullable(),
});

export const updateCateringQuoteSchema = z.object({
  status: z.enum(["pending", "reviewed", "quoted", "confirmed", "cancelled"]).optional(),
  adminNotes: z.string().optional().nullable(),
  quoteSentAt: z.string().optional().nullable(),
});

export type InsertCateringQuote = z.infer<typeof insertCateringQuoteSchema>;
export type UpdateCateringQuote = z.infer<typeof updateCateringQuoteSchema>;
export type CateringQuote = typeof cateringQuotes.$inferSelect;

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientType: varchar("recipient_type", { length: 20 }).notNull(), // 'admin' or 'customer'
  recipientId: integer("recipient_id"), // admin_user_id or null for general admin notifications
  type: varchar("type", { length: 50 }).notNull(), // order_confirmed, new_message, etc.
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 255 }), // Optional link to relevant page
  isRead: integer("is_read").notNull().default(0),
  emailSent: integer("email_sent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = z.object({
  recipientType: z.enum(["admin", "customer"]),
  recipientId: z.number().optional().nullable(),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  link: z.string().max(255).optional().nullable(),
  isRead: z.number().optional().default(0),
  emailSent: z.number().optional().default(0),
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ============================================================
// RELATIONS
// ============================================================

import { relations } from "drizzle-orm";

// Gallery Albums Relations
export const galleryAlbumsRelations = relations(galleryAlbums, ({ many, one }) => ({
  photos: many(galleryPhotos),
  coverImage: one(mediaAssets, {
    fields: [galleryAlbums.coverImageId],
    references: [mediaAssets.id],
  }),
}));

// Gallery Photos Relations
export const galleryPhotosRelations = relations(galleryPhotos, ({ one }) => ({
  album: one(galleryAlbums, {
    fields: [galleryPhotos.albumId],
    references: [galleryAlbums.id],
  }),
  mediaAsset: one(mediaAssets, {
    fields: [galleryPhotos.mediaId],
    references: [mediaAssets.id],
  }),
}));

// Square Payment Settings
export const squareSettings = pgTable("square_settings", {
  id: serial("id").primaryKey(),
  environment: varchar("environment", { length: 20 }).notNull().default("sandbox"), // "sandbox" or "production"
  applicationId: varchar("application_id", { length: 255 }).notNull(),
  accessToken: text("access_token").notNull(),
  applicationSecret: text("application_secret"),
  locationId: varchar("location_id", { length: 100 }).notNull(),
  locationName: varchar("location_name", { length: 255 }),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table session existante en base - à ne pas supprimer
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const insertSquareSettingsSchema = createInsertSchema(squareSettings);
export type InsertSquareSettings = z.infer<typeof insertSquareSettingsSchema>;
export type SelectSquareSettings = typeof squareSettings.$inferSelect;
