import { pgTable, foreignKey, unique, serial, varchar, text, integer, timestamp, index, numeric, json, boolean, jsonb, check, interval, pgView, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const deliveryStatusType = pgEnum("delivery_status_type", ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'delayed', 'cancelled', 'pickup_ready', 'picked_up'])


export const announcements = pgTable("announcements", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 150 }).notNull(),
	slug: varchar({ length: 150 }).notNull(),
	content: text().notNull(),
	excerpt: text(),
	imageUrl: varchar("image_url", { length: 255 }),
	active: integer().default(1).notNull(),
	featured: integer().default(0).notNull(),
	priority: varchar({ length: 20 }).default('normal'),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	imageId: integer("image_id"),
}, (table) => [
	foreignKey({
			columns: [table.imageId],
			foreignColumns: [mediaAssets.id],
			name: "announcements_image_id_fkey"
		}).onDelete("set null"),
	unique("announcements_slug_unique").on(table.slug),
]);

export const heroSlides = pgTable("hero_slides", {
	id: serial().primaryKey().notNull(),
	dcId: varchar("dc_id", { length: 20 }).notNull(),
	title: varchar({ length: 100 }),
	mediaId: integer("media_id").notNull(),
	mediaType: varchar("media_type", { length: 10 }).default('image').notNull(),
	altText: varchar("alt_text", { length: 200 }),
	textContent: text("text_content"),
	textPosition: varchar("text_position", { length: 20 }).default('center'),
	logoId: integer("logo_id"),
	logoSize: varchar("logo_size", { length: 20 }).default('medium'),
	displayOrder: integer("display_order").default(0),
	active: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	logoVisible: integer("logo_visible").default(1).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.mediaId],
			foreignColumns: [mediaAssets.id],
			name: "fk_hero_slides_media"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.logoId],
			foreignColumns: [mediaAssets.id],
			name: "fk_hero_slides_logo"
		}).onDelete("set null"),
	unique("hero_slides_dc_id_unique").on(table.dcId),
]);

export const customers = pgTable("customers", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }),
	dcId: varchar("dc_id", { length: 20 }),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	password: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	address: text(),
	city: varchar({ length: 100 }),
	postalCode: varchar("postal_code", { length: 20 }),
	notes: text(),
	totalOrders: integer("total_orders").default(0),
	totalSpent: numeric("total_spent", { precision: 10, scale:  2 }).default('0'),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	lastUsernameChange: timestamp("last_username_change", { mode: 'string' }),
	lastActivity: timestamp("last_activity", { mode: 'string' }),
	active: integer().default(1).notNull(),
	emailVerified: integer("email_verified").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	apartment: varchar({ length: 20 }),
}, (table) => [
	index("idx_customers_apartment").using("btree", table.apartment.asc().nullsLast().op("text_ops")).where(sql`(apartment IS NOT NULL)`),
	index("idx_customers_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_customers_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("customers_username_unique").on(table.username),
	unique("customers_dc_id_unique").on(table.dcId),
	unique("customers_email_unique").on(table.email),
]);

export const gallery = pgTable("gallery", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 100 }).notNull(),
	type: varchar({ length: 20 }).notNull(),
	mediaId: integer("media_id").notNull(),
	thumbnailId: integer("thumbnail_id"),
	description: text(),
	category: varchar({ length: 50 }).default('plats'),
	displayOrder: integer("display_order").default(0),
	active: integer().default(1).notNull(),
	featured: integer().default(0).notNull(),
	altText: varchar("alt_text", { length: 200 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_gallery_active").using("btree", table.active.asc().nullsLast().op("int4_ops")),
	index("idx_gallery_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.mediaId],
			foreignColumns: [mediaAssets.id],
			name: "fk_gallery_media"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.thumbnailId],
			foreignColumns: [mediaAssets.id],
			name: "fk_gallery_thumbnail"
		}).onDelete("set null"),
]);

export const events = pgTable("events", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 150 }).notNull(),
	slug: varchar({ length: 150 }).notNull(),
	description: text(),
	activityDate: timestamp("activity_date", { mode: 'string' }),
	location: varchar({ length: 200 }),
	address: text(),
	imageId: integer("image_id"),
	mediaAttachments: json("media_attachments"),
	price: numeric({ precision: 10, scale:  2 }),
	featured: integer().default(0).notNull(),
	category: varchar({ length: 50 }).default('general'),
	status: varchar({ length: 50 }).default('upcoming'),
	contactInfo: text("contact_info"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isFree: boolean("is_free"),
	attachmentFiles: json("attachment_files"),
	postType: varchar("post_type", { length: 50 }).default('activity'),
	content: text(),
	shortExcerpt: text("short_excerpt"),
	mediaGallery: json("media_gallery"),
	isPinned: boolean("is_pinned").default(false),
	isPublished: boolean("is_published").default(true),
	publishedAt: timestamp("published_at", { mode: 'string' }).defaultNow(),
	authorId: integer("author_id"),
	engagementStats: json("engagement_stats"),
	maxParticipants: integer("max_participants"),
	currentReservations: integer("current_reservations").default(0),
	requiresReservation: boolean("requires_reservation").default(false),
	reservationDeadline: timestamp("reservation_deadline", { mode: 'string' }),
	ticketTypes: json("ticket_types"),
}, (table) => [
	index("idx_events_activity_date").using("btree", table.activityDate.asc().nullsLast().op("timestamp_ops")),
	index("idx_events_date").using("btree", table.activityDate.asc().nullsLast().op("timestamp_ops")),
	index("idx_events_is_free").using("btree", table.isFree.asc().nullsLast().op("bool_ops")),
	index("idx_events_pinned").using("btree", table.isPinned.asc().nullsLast().op("bool_ops")),
	index("idx_events_post_type").using("btree", table.postType.asc().nullsLast().op("text_ops")),
	index("idx_events_published").using("btree", table.isPublished.asc().nullsLast().op("timestamp_ops"), table.publishedAt.desc().nullsFirst().op("bool_ops")),
	index("idx_events_requires_reservation").using("btree", table.requiresReservation.asc().nullsLast().op("bool_ops")),
	index("idx_events_reservation_deadline").using("btree", table.reservationDeadline.asc().nullsLast().op("timestamp_ops")),
	index("idx_events_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_events_status_date").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.activityDate.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.imageId],
			foreignColumns: [mediaAssets.id],
			name: "fk_events_image"
		}).onDelete("set null"),
	unique("events_slug_unique").on(table.slug),
]);

export const conversationMessages = pgTable("conversation_messages", {
	id: serial().primaryKey().notNull(),
	conversationId: integer("conversation_id").notNull(),
	message: text().notNull(),
	fromType: varchar("from_type", { length: 20 }).notNull(),
	fromAdminId: integer("from_admin_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const internalMessages = pgTable("internal_messages", {
	id: serial().primaryKey().notNull(),
	dcId: varchar("dc_id", { length: 20 }).notNull(),
	fromUserId: integer("from_user_id"),
	fromUserType: varchar("from_user_type", { length: 20 }).notNull(),
	toUserId: integer("to_user_id"),
	toUserType: varchar("to_user_type", { length: 20 }).notNull(),
	subject: varchar({ length: 200 }).notNull(),
	message: text().notNull(),
	relatedOrderId: integer("related_order_id"),
	relatedQuoteId: integer("related_quote_id"),
	priority: varchar({ length: 20 }).default('normal'),
	status: varchar({ length: 20 }).default('unread'),
	readAt: timestamp("read_at", { mode: 'string' }),
	repliedAt: timestamp("replied_at", { mode: 'string' }),
	parentMessageId: integer("parent_message_id"),
	attachments: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("internal_messages_dc_id_unique").on(table.dcId),
]);

export const mailjetSettings = pgTable("mailjet_settings", {
	id: serial().primaryKey().notNull(),
	apiKey: varchar("api_key", { length: 255 }),
	secretKey: varchar("secret_key", { length: 255 }),
	fromEmail: varchar("from_email", { length: 100 }).default('info@douniecuisine.com').notNull(),
	fromName: varchar("from_name", { length: 100 }).default('Dounie Cuisine').notNull(),
	isActive: integer("is_active").default(0).notNull(),
	templateOrderConfirmation: varchar("template_order_confirmation", { length: 50 }),
	templateWelcome: varchar("template_welcome", { length: 50 }),
	templateContactForm: varchar("template_contact_form", { length: 50 }),
	templateEventBooking: varchar("template_event_booking", { length: 50 }),
	templateEmailVerification: varchar("template_email_verification", { length: 50 }),
	updatedByAdminId: integer("updated_by_admin_id"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	enableOrderStatusUpdate: integer("enable_order_status_update").default(1),
	enablePaymentConfirmation: integer("enable_payment_confirmation").default(1),
	enableOrderCancellation: integer("enable_order_cancellation").default(1),
	enableDeliveryNotification: integer("enable_delivery_notification").default(1),
	enablePickupReady: integer("enable_pickup_ready").default(1),
	enablePasswordReset: integer("enable_password_reset").default(1),
	enableAdminNotifications: integer("enable_admin_notifications").default(1),
});

export const menuSchedules = pgTable("menu_schedules", {
	id: serial().primaryKey().notNull(),
	dcId: varchar("dc_id", { length: 20 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	description: text(),
	startTime: varchar("start_time", { length: 10 }).notNull(),
	endTime: varchar("end_time", { length: 10 }).notNull(),
	daysOfWeek: json("days_of_week").notNull(),
	recurrenceType: varchar("recurrence_type", { length: 50 }).default('weekly').notNull(),
	isActive: integer("is_active").default(1).notNull(),
	priority: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("menu_schedules_dc_id_unique").on(table.dcId),
]);

export const eventBookings = pgTable("event_bookings", {
	id: serial().primaryKey().notNull(),
	eventId: integer("event_id"),
	customerId: integer("customer_id"),
	customerName: varchar("customer_name", { length: 100 }).notNull(),
	customerEmail: varchar("customer_email", { length: 100 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
	eventDate: timestamp("event_date", { mode: 'string' }).notNull(),
	eventTime: varchar("event_time", { length: 10 }).notNull(),
	guestsCount: integer("guests_count").notNull(),
	menuType: varchar("menu_type", { length: 100 }),
	location: text(),
	specialRequests: text("special_requests"),
	depositAmount: numeric("deposit_amount", { precision: 10, scale:  2 }),
	totalEstimate: numeric("total_estimate", { precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('pending').notNull(),
	adminNotes: text("admin_notes"),
	confirmedByAdminId: integer("confirmed_by_admin_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const menuSections = pgTable("menu_sections", {
	id: serial().primaryKey().notNull(),
	nameFr: varchar("name_fr", { length: 100 }).notNull(),
	nameEn: varchar("name_en", { length: 100 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	colorHex: varchar("color_hex", { length: 7 }).default('#E85D04'),
	iconName: varchar("icon_name", { length: 50 }),
	isActive: integer("is_active").default(1).notNull(),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	conversationId: varchar("conversation_id", { length: 100 }).notNull(),
	senderId: integer("sender_id").notNull(),
	senderType: varchar("sender_type", { length: 20 }).notNull(),
	senderName: varchar("sender_name", { length: 100 }).notNull(),
	recipientId: integer("recipient_id").notNull(),
	recipientType: varchar("recipient_type", { length: 20 }).notNull(),
	subject: varchar({ length: 200 }),
	content: text().notNull(),
	isRead: integer("is_read").default(0).notNull(),
	attachments: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const newsletterCampaigns = pgTable("newsletter_campaigns", {
	id: serial().primaryKey().notNull(),
	subjectFr: varchar("subject_fr", { length: 200 }).notNull(),
	subjectEn: varchar("subject_en", { length: 200 }).notNull(),
	contentHtmlFr: text("content_html_fr").notNull(),
	contentHtmlEn: text("content_html_en").notNull(),
	sendCondition: varchar("send_condition", { length: 50 }).notNull(),
	scheduledDate: timestamp("scheduled_date", { mode: 'string' }),
	status: varchar({ length: 20 }).default('draft').notNull(),
	recipientsCount: integer("recipients_count").default(0),
	sentCount: integer("sent_count").default(0),
	openedCount: integer("opened_count").default(0),
	clickedCount: integer("clicked_count").default(0),
	createdByAdminId: integer("created_by_admin_id"),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	recipientType: varchar("recipient_type", { length: 20 }).notNull(),
	recipientId: integer("recipient_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	message: text().notNull(),
	link: varchar({ length: 255 }),
	isRead: integer("is_read").default(0).notNull(),
	emailSent: integer("email_sent").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	entityId: integer("entity_id"),
}, (table) => [
	index("idx_notifications_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: serial().primaryKey().notNull(),
	token: varchar({ length: 255 }).notNull(),
	customerId: integer("customer_id"),
	adminUserId: integer("admin_user_id"),
	userType: varchar("user_type", { length: 20 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	used: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("password_reset_tokens_token_unique").on(table.token),
]);

export const popupAnnouncements = pgTable("popup_announcements", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	imageUrl: varchar("image_url", { length: 255 }),
	buttonText: varchar("button_text", { length: 100 }),
	buttonUrl: varchar("button_url", { length: 255 }),
	displayFrequency: varchar("display_frequency", { length: 20 }).default('once'),
	targetAudience: varchar("target_audience", { length: 50 }).default('all'),
	active: integer().default(1).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	displayCount: integer("display_count").default(0),
	clickCount: integer("click_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const receipts = pgTable("receipts", {
	id: serial().primaryKey().notNull(),
	dcId: varchar("dc_id", { length: 20 }).notNull(),
	orderId: integer("order_id").notNull(),
	orderDcId: varchar("order_dc_id", { length: 20 }).notNull(),
	customerId: integer("customer_id"),
	customerDcId: varchar("customer_dc_id", { length: 20 }),
	receiptNumber: varchar("receipt_number", { length: 30 }).notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).notNull(),
	deliveryFee: numeric("delivery_fee", { precision: 10, scale:  2 }).default('0'),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).default('0'),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	transactionId: varchar("transaction_id", { length: 100 }),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("receipts_dc_id_unique").on(table.dcId),
	unique("receipts_receipt_number_unique").on(table.receiptNumber),
]);

export const reviews = pgTable("reviews", {
	id: serial().primaryKey().notNull(),
	customerId: integer("customer_id").notNull(),
	customerName: varchar("customer_name", { length: 100 }).notNull(),
	orderId: integer("order_id"),
	dishId: integer("dish_id"),
	rating: integer().notNull(),
	comment: text(),
	photos: jsonb(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	moderatedByAdminId: integer("moderated_by_admin_id"),
	moderationNote: text("moderation_note"),
	isPublic: integer("is_public").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const adminPermissions = pgTable("admin_permissions", {
	id: serial().notNull(),
	adminUserId: integer("admin_user_id"),
	permissionLevel: text("permission_level").default('staff'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.adminUserId],
			foreignColumns: [adminUsers.id],
			name: "admin_permissions_admin_user_id_fkey"
		}),
	check("admin_permissions_permission_level_check", sql`permission_level = ANY (ARRAY['super_admin'::text, 'admin'::text, 'staff'::text])`),
]);

export const dishSides = pgTable("dish_sides", {
	id: serial().primaryKey().notNull(),
	dishId: integer("dish_id").notNull(),
	sideId: integer("side_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_dish_sides_dish_id").using("btree", table.dishId.asc().nullsLast().op("int4_ops")),
	index("idx_dish_sides_side_id").using("btree", table.sideId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.dishId],
			foreignColumns: [dishes.id],
			name: "dish_sides_dish_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sideId],
			foreignColumns: [sides.id],
			name: "dish_sides_side_id_fkey"
		}).onDelete("cascade"),
	unique("dish_sides_dish_id_side_id_key").on(table.dishId, table.sideId),
]);

export const orderItems = pgTable("order_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	dishId: integer("dish_id").notNull(),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	specialRequests: text("special_requests"),
}, (table) => [
	index("idx_order_items_dish_id").using("btree", table.dishId.asc().nullsLast().op("int4_ops")),
	index("idx_order_items_order_id").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
]);

export const eventsBackup = pgTable("events_backup", {
	id: integer(),
	title: varchar({ length: 150 }),
	slug: varchar({ length: 150 }),
	description: text(),
	eventDate: timestamp("event_date", { mode: 'string' }),
	eventTime: varchar("event_time", { length: 10 }),
	endDate: timestamp("end_date", { mode: 'string' }),
	location: varchar({ length: 200 }),
	address: text(),
	imageId: integer("image_id"),
	galleryImages: json("gallery_images"),
	price: numeric({ precision: 10, scale:  2 }),
	maxGuests: integer("max_guests"),
	currentBookings: integer("current_bookings"),
	featured: integer(),
	category: varchar({ length: 50 }),
	status: varchar({ length: 50 }),
	contactInfo: text("contact_info"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	eventType: varchar("event_type", { length: 50 }),
	isFree: boolean("is_free"),
	requiresBooking: boolean("requires_booking"),
	promotional: boolean(),
	announcementText: text("announcement_text"),
	attachmentFiles: json("attachment_files"),
	displayUntil: timestamp("display_until", { mode: 'string' }),
	tags: varchar({ length: 500 }),
	priority: integer(),
});

export const takeoutMenuSections = pgTable("takeout_menu_sections", {
	id: serial().primaryKey().notNull(),
	menuId: integer("menu_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const takeoutMenus = pgTable("takeout_menus", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	isActive: integer("is_active").default(0).notNull(),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const takeoutSectionDishes = pgTable("takeout_section_dishes", {
	id: serial().primaryKey().notNull(),
	sectionId: integer("section_id").notNull(),
	dishId: integer("dish_id").notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const testimonials = pgTable("testimonials", {
	id: serial().primaryKey().notNull(),
	clientName: varchar("client_name", { length: 100 }).notNull(),
	clientPhotoId: integer("client_photo_id"),
	rating: integer().notNull(),
	comment: text().notNull(),
	eventType: varchar("event_type", { length: 50 }),
	eventDate: timestamp("event_date", { mode: 'string' }),
	location: varchar({ length: 100 }),
	featured: integer().default(0).notNull(),
	approved: integer().default(0).notNull(),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_testimonials_approved").using("btree", table.approved.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.clientPhotoId],
			foreignColumns: [mediaAssets.id],
			name: "fk_testimonials_photo"
		}).onDelete("set null"),
]);

export const cateringItems = pgTable("catering_items", {
	id: serial().primaryKey().notNull(),
	categoryId: integer("category_id").notNull(),
	nameFr: varchar("name_fr", { length: 150 }).notNull(),
	nameEn: varchar("name_en", { length: 150 }).notNull(),
	descriptionFr: text("description_fr"),
	descriptionEn: text("description_en"),
	imageId: integer("image_id"),
	displayOrder: integer("display_order").default(0).notNull(),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_catering_items_category").using("btree", table.categoryId.asc().nullsLast().op("int4_ops")),
	index("idx_catering_items_order").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [cateringCategories.id],
			name: "catering_items_category_id_fkey"
		}).onDelete("cascade"),
]);

export const cateringItemPrices = pgTable("catering_item_prices", {
	id: serial().primaryKey().notNull(),
	itemId: integer("item_id").notNull(),
	sizeLabelFr: varchar("size_label_fr", { length: 50 }).notNull(),
	sizeLabelEn: varchar("size_label_en", { length: 50 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	isDefault: integer("is_default").default(0).notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_catering_item_prices_item").using("btree", table.itemId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [cateringItems.id],
			name: "catering_item_prices_item_id_fkey"
		}).onDelete("cascade"),
]);

export const emailTemplates = pgTable("email_templates", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	displayName: varchar("display_name", { length: 150 }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	htmlContent: text("html_content").notNull(),
	textContent: text("text_content"),
	variables: json(),
	isActive: boolean("is_active").default(true),
	description: text(),
	category: varchar({ length: 50 }).default('general'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_email_templates_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_email_templates_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_email_templates_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("email_templates_name_key").on(table.name),
]);

export const session = pgTable("session", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const cateringCategories = pgTable("catering_categories", {
	id: serial().primaryKey().notNull(),
	nameFr: varchar("name_fr", { length: 100 }).notNull(),
	nameEn: varchar("name_en", { length: 100 }).notNull(),
	descriptionFr: text("description_fr"),
	descriptionEn: text("description_en"),
	displayOrder: integer("display_order").default(0).notNull(),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_catering_categories_order").using("btree", table.displayOrder.asc().nullsLast().op("int4_ops")),
]);

export const customerNewsletterPreferences = pgTable("customer_newsletter_preferences", {
	id: serial().primaryKey().notNull(),
	customerEmail: varchar("customer_email", { length: 255 }).notNull(),
	customerName: varchar("customer_name", { length: 255 }),
	isSubscribed: boolean("is_subscribed").default(true),
	subscribedAt: timestamp("subscribed_at", { mode: 'string' }).defaultNow(),
	unsubscribedAt: timestamp("unsubscribed_at", { mode: 'string' }),
	maxEmailsPerWeek: integer("max_emails_per_week").default(2),
	preferredDay: varchar("preferred_day", { length: 20 }).default('any'),
	preferredTime: varchar("preferred_time", { length: 20 }).default('any'),
	customerSegment: varchar("customer_segment", { length: 50 }).default('regular'),
	lastOrderDate: timestamp("last_order_date", { mode: 'string' }),
	totalOrders: integer("total_orders").default(0),
	lastEmailOpened: timestamp("last_email_opened", { mode: 'string' }),
	totalEmailsOpened: integer("total_emails_opened").default(0),
	lastLinkClicked: timestamp("last_link_clicked", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_customer_newsletter_email").using("btree", table.customerEmail.asc().nullsLast().op("text_ops")),
	index("idx_customer_newsletter_subscribed").using("btree", table.isSubscribed.asc().nullsLast().op("bool_ops")),
	unique("customer_newsletter_preferences_customer_email_key").on(table.customerEmail),
]);

export const newsletters = pgTable("newsletters", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	htmlContent: text("html_content").notNull(),
	previewText: varchar("preview_text", { length: 200 }),
	isActive: boolean("is_active").default(false),
	isScheduled: boolean("is_scheduled").default(false),
	sendImmediately: boolean("send_immediately").default(false),
	scheduledDate: timestamp("scheduled_date", { mode: 'string' }),
	targetAudience: jsonb("target_audience").default({"all_customers":true,"newsletter_subscribers":false}),
	customerSegments: jsonb("customer_segments").default([]),
	frequencyType: varchar("frequency_type", { length: 50 }).default('manual'),
	maxSendsPerMonth: integer("max_sends_per_month").default(4),
	minDaysBetweenSends: integer("min_days_between_sends").default(7),
	totalSent: integer("total_sent").default(0),
	totalOpened: integer("total_opened").default(0),
	totalClicked: integer("total_clicked").default(0),
	lastSentAt: timestamp("last_sent_at", { mode: 'string' }),
	createdBy: varchar("created_by", { length: 100 }).default('admin'),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_newsletters_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_newsletters_scheduled").using("btree", table.isScheduled.asc().nullsLast().op("timestamp_ops"), table.scheduledDate.asc().nullsLast().op("bool_ops")),
	unique("newsletters_name_key").on(table.name),
]);

export const newsletterSends = pgTable("newsletter_sends", {
	id: serial().primaryKey().notNull(),
	newsletterId: integer("newsletter_id"),
	sentToCount: integer("sent_to_count").notNull(),
	targetAudience: jsonb("target_audience"),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
	deliveredCount: integer("delivered_count").default(0),
	openedCount: integer("opened_count").default(0),
	clickedCount: integer("clicked_count").default(0),
	bouncedCount: integer("bounced_count").default(0),
	sentBy: varchar("sent_by", { length: 100 }).default('admin'),
	campaignNotes: text("campaign_notes"),
}, (table) => [
	index("idx_newsletter_sends_newsletter_id").using("btree", table.newsletterId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.newsletterId],
			foreignColumns: [newsletters.id],
			name: "newsletter_sends_newsletter_id_fkey"
		}).onDelete("cascade"),
]);

export const emailQueue = pgTable("email_queue", {
	id: serial().primaryKey().notNull(),
	templateName: varchar("template_name", { length: 100 }).notNull(),
	recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
	orderId: integer("order_id"),
	newsletterId: integer("newsletter_id"),
	templateData: jsonb("template_data"),
	priority: varchar({ length: 20 }).default('normal'),
	status: varchar({ length: 20 }).default('pending'),
	attempts: integer().default(0),
	maxAttempts: integer("max_attempts").default(3),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
}, (table) => [
	index("idx_email_queue_priority").using("btree", table.priority.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("idx_email_queue_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_email_queue_template").using("btree", table.templateName.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "email_queue_order_id_fkey"
		}).onDelete("set null"),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	dcId: varchar("dc_id", { length: 20 }),
	orderNumber: varchar("order_number", { length: 20 }).notNull(),
	customerId: integer("customer_id"),
	customerName: varchar("customer_name", { length: 100 }).notNull(),
	customerEmail: varchar("customer_email", { length: 100 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 20 }),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).default('0'),
	deliveryFee: numeric("delivery_fee", { precision: 10, scale:  2 }).default('0'),
	status: varchar({ length: 50 }).default('pending').notNull(),
	paymentStatus: varchar("payment_status", { length: 50 }).default('pending').notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentProvider: varchar("payment_provider", { length: 50 }),
	paymentId: varchar("payment_id", { length: 255 }),
	transactionId: varchar("transaction_id", { length: 100 }),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	orderType: varchar("order_type", { length: 50 }).notNull(),
	deliveryDate: timestamp("delivery_date", { mode: 'string' }),
	deliveryTime: varchar("delivery_time", { length: 10 }),
	deliveryAddress: text("delivery_address"),
	specialInstructions: text("special_instructions"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deliveryApartment: varchar("delivery_apartment", { length: 20 }),
	deliveryStatus: varchar("delivery_status", { length: 50 }).default('pending'),
	readyAt: timestamp("ready_at", { mode: 'string' }),
	outForDeliveryAt: timestamp("out_for_delivery_at", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	delayReason: text("delay_reason"),
	estimatedDeliveryTime: interval("estimated_delivery_time"),
	actualDeliveryTime: interval("actual_delivery_time"),
	statusHistory: jsonb("status_history").default([]),
}, (table) => [
	index("idx_orders_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_orders_customer_email").using("btree", table.customerEmail.asc().nullsLast().op("text_ops")),
	index("idx_orders_delivery_apartment").using("btree", table.deliveryApartment.asc().nullsLast().op("text_ops")).where(sql`(delivery_apartment IS NOT NULL)`),
	index("idx_orders_delivery_status").using("btree", table.deliveryStatus.asc().nullsLast().op("text_ops")),
	index("idx_orders_status_date").using("btree", table.deliveryStatus.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("idx_orders_status_timestamps").using("btree", table.readyAt.asc().nullsLast().op("timestamp_ops"), table.outForDeliveryAt.asc().nullsLast().op("timestamp_ops"), table.deliveredAt.asc().nullsLast().op("timestamp_ops")),
	unique("orders_dc_id_unique").on(table.dcId),
	unique("orders_order_number_unique").on(table.orderNumber),
]);

export const cateringDecorativeImages = pgTable("catering_decorative_images", {
	id: serial().primaryKey().notNull(),
	imageId: integer("image_id"),
	position: varchar({ length: 20 }).default('random').notNull(),
	displayOrder: integer("display_order").default(0),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	userType: varchar("user_type", { length: 20 }).notNull(),
	username: varchar({ length: 100 }),
	action: varchar({ length: 100 }).notNull(),
	tableName: varchar("table_name", { length: 100 }),
	recordId: integer("record_id"),
	oldValue: json("old_value"),
	newValue: json("new_value"),
	description: text(),
	ipAddress: varchar("ip_address", { length: 50 }),
	userAgent: varchar("user_agent", { length: 500 }),
	severity: varchar({ length: 20 }).default('info'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_logs_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_audit_logs_user").using("btree", table.userType.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("int4_ops")),
]);

export const cateringMenuItems = pgTable("catering_menu_items", {
	id: serial().primaryKey().notNull(),
	nameFr: varchar("name_fr", { length: 150 }).notNull(),
	nameEn: varchar("name_en", { length: 150 }).notNull(),
	descriptionFr: text("description_fr"),
	descriptionEn: text("description_en"),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	category: varchar({ length: 100 }).notNull(),
	imageId: integer("image_id"),
	displayOrder: integer("display_order").default(0),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }),
	subject: varchar({ length: 150 }),
	message: text().notNull(),
	inquiryType: varchar("inquiry_type", { length: 50 }).default('general'),
	status: varchar({ length: 20 }).default('new'),
	adminNotes: text("admin_notes"),
	repliedAt: timestamp("replied_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_contact_messages_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_contact_messages_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const dishVariantsNew = pgTable("dish_variants_new", {
	id: serial().notNull(),
	dishId: integer("dish_id").notNull(),
	label: varchar({ length: 100 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	displayOrder: integer("display_order").default(0),
	isDefault: integer("is_default").default(0),
	isActive: integer("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_dish_variants_new_dish_id").using("btree", table.dishId.asc().nullsLast().op("int4_ops")),
	index("idx_dish_variants_new_display_order").using("btree", table.dishId.asc().nullsLast().op("int4_ops"), table.displayOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.dishId],
			foreignColumns: [dishes.id],
			name: "dish_variants_new_dish_id_fkey"
		}).onDelete("cascade"),
]);

export const conversations = pgTable("conversations", {
	id: serial().primaryKey().notNull(),
	customerId: integer("customer_id").notNull(),
	subject: varchar({ length: 200 }).notNull(),
	status: varchar({ length: 20 }).default('open').notNull(),
	unreadByCustomer: integer("unread_by_customer").default(0).notNull(),
	unreadByAdmin: integer("unread_by_admin").default(0).notNull(),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }).defaultNow().notNull(),
	closedAt: timestamp("closed_at", { mode: 'string' }),
	closedByAdminId: integer("closed_by_admin_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const legacyDishesVariantsBackup = pgTable("legacy_dishes_variants_backup", {
	dishId: integer("dish_id"),
	name: varchar({ length: 100 }),
	priceSmall: numeric("price_small", { precision: 10, scale:  2 }),
	priceLarge: numeric("price_large", { precision: 10, scale:  2 }),
	defaultSize: varchar("default_size", { length: 10 }),
	hasVariants: boolean("has_variants"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const siteInfo = pgTable("site_info", {
	id: serial().primaryKey().notNull(),
	businessName: varchar("business_name", { length: 100 }).notNull(),
	tagline: varchar({ length: 200 }),
	description: text(),
	phone1: varchar({ length: 20 }),
	phone1Label: varchar("phone1_label", { length: 50 }).default('Principal'),
	phone2: varchar({ length: 20 }),
	phone2Label: varchar("phone2_label", { length: 50 }).default('Secondaire'),
	phone3: varchar({ length: 20 }),
	phone3Label: varchar("phone3_label", { length: 50 }).default('Autre'),
	emailPrimary: varchar("email_primary", { length: 100 }),
	emailSecondary: varchar("email_secondary", { length: 100 }),
	emailSupport: varchar("email_support", { length: 100 }),
	address: text(),
	city: varchar({ length: 100 }),
	province: varchar({ length: 50 }),
	postalCode: varchar("postal_code", { length: 20 }),
	country: varchar({ length: 50 }).default('Canada'),
	businessHours: json("business_hours"),
	tpsRate: numeric("tps_rate", { precision: 5, scale:  3 }).default('0.050'),
	tvqRate: numeric("tvq_rate", { precision: 5, scale:  4 }).default('0.09975'),
	deliveryFee: numeric("delivery_fee", { precision: 10, scale:  2 }).default('8.50'),
	freeDeliveryThreshold: numeric("free_delivery_threshold", { precision: 10, scale:  2 }),
	deliveryRadiusKm: numeric("delivery_radius_km", { precision: 10, scale:  2 }).default('15.00'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	logoId: integer("logo_id"),
	facebookUrl: varchar("facebook_url", { length: 255 }),
	facebookEnabled: integer("facebook_enabled").default(0),
	instagramUrl: varchar("instagram_url", { length: 255 }),
	instagramEnabled: integer("instagram_enabled").default(0),
	twitterUrl: varchar("twitter_url", { length: 255 }),
	twitterEnabled: integer("twitter_enabled").default(0),
	tiktokUrl: varchar("tiktok_url", { length: 255 }),
	tiktokEnabled: integer("tiktok_enabled").default(0),
	youtubeUrl: varchar("youtube_url", { length: 255 }),
	youtubeEnabled: integer("youtube_enabled").default(0),
	linkedinUrl: varchar("linkedin_url", { length: 255 }),
	linkedinEnabled: integer("linkedin_enabled").default(0),
	pinterestUrl: varchar("pinterest_url", { length: 255 }),
	pinterestEnabled: integer("pinterest_enabled").default(0),
	whatsappNumber: varchar("whatsapp_number", { length: 20 }),
	whatsappEnabled: integer("whatsapp_enabled").default(0),
	siteUrl: varchar("site_url", { length: 255 }),
	adminUrl: varchar("admin_url", { length: 255 }),
	metaDescription: text("meta_description"),
	metaKeywords: text("meta_keywords"),
	menuDisplayEnabled: integer("menu_display_enabled").default(1),
	menuDisplayDays: varchar("menu_display_days", { length: 100 }).default('thursday,friday,saturday'),
	menuDisplayStartTime: varchar("menu_display_start_time", { length: 10 }).default('10:00'),
	menuDisplayEndTime: varchar("menu_display_end_time", { length: 10 }).default('20:00'),
	unifiedPhone: varchar("unified_phone", { length: 20 }),
	unifiedEmail: varchar("unified_email", { length: 100 }),
	unifiedAddress: text("unified_address"),
	websiteUrl: varchar("website_url", { length: 255 }),
	logoVisible: integer("logo_visible").default(1).notNull(),
}, (table) => [
	index("idx_site_info_logo_id").using("btree", table.logoId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.logoId],
			foreignColumns: [mediaAssets.id],
			name: "site_info_logo_id_fkey"
		}),
	foreignKey({
			columns: [table.logoId],
			foreignColumns: [mediaAssets.id],
			name: "fk_site_logo"
		}).onDelete("set null"),
]);

export const promoCodes = pgTable("promo_codes", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	discountType: varchar("discount_type", { length: 20 }).notNull(),
	discountValue: numeric("discount_value", { precision: 10, scale:  2 }).notNull(),
	minOrderAmount: numeric("min_order_amount", { precision: 10, scale:  2 }).default('0'),
	maxDiscount: numeric("max_discount", { precision: 10, scale:  2 }),
	usageLimit: integer("usage_limit"),
	usedCount: integer("used_count").default(0),
	expiryDate: timestamp("expiry_date", { mode: 'string' }),
	isActive: integer("is_active").default(1).notNull(),
	description: text(),
	createdByAdminId: integer("created_by_admin_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("promo_codes_code_unique").on(table.code),
]);

export const scheduledMenuItems = pgTable("scheduled_menu_items", {
	id: serial().primaryKey().notNull(),
	menuScheduleId: integer("menu_schedule_id").notNull(),
	dishId: integer("dish_id").notNull(),
	specialPrice: numeric("special_price", { precision: 10, scale:  2 }),
	maxQuantity: integer("max_quantity"),
	displayOrder: integer("display_order").default(0),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const siteBanners = pgTable("site_banners", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	message: text().notNull(),
	type: varchar({ length: 20 }).default('info'),
	backgroundColor: varchar("background_color", { length: 50 }),
	textColor: varchar("text_color", { length: 50 }),
	linkUrl: varchar("link_url", { length: 255 }),
	linkText: varchar("link_text", { length: 100 }),
	dismissible: integer().default(1).notNull(),
	position: varchar({ length: 20 }).default('top'),
	active: integer().default(1).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const dishes = pgTable("dishes", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }),
	category: varchar({ length: 50 }).notNull(),
	imageId: integer("image_id"),
	ingredients: text(),
	allergens: varchar({ length: 200 }),
	spiceLevel: varchar("spice_level", { length: 20 }).default('moyen'),
	available: integer().default(1).notNull(),
	featured: integer().default(0).notNull(),
	isTakeout: integer("is_takeout").default(0).notNull(),
	isCatering: integer("is_catering").default(0).notNull(),
	preparationTime: integer("preparation_time").default(30),
	displayOrder: integer("display_order").default(0),
	status: varchar({ length: 20 }).default('available').notNull(),
	isActive: integer("is_active").default(1).notNull(),
	sectionId: integer("section_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	hasVariants: boolean("has_variants").default(false),
}, (table) => [
	index("idx_dishes_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.imageId],
			foreignColumns: [mediaAssets.id],
			name: "fk_dishes_image"
		}).onDelete("set null"),
]);

export const legalPages = pgTable("legal_pages", {
	id: serial().primaryKey().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	metaDescription: varchar("meta_description", { length: 300 }),
	active: integer().default(1).notNull(),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("legal_pages_slug_unique").on(table.slug),
]);

export const customerNotifications = pgTable("customer_notifications", {
	id: serial().primaryKey().notNull(),
	customerId: integer("customer_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	message: text().notNull(),
	type: varchar({ length: 50 }).default('info').notNull(),
	relatedOrderId: integer("related_order_id"),
	relatedOrderNumber: varchar("related_order_number", { length: 20 }),
	read: integer().default(0).notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const sides = pgTable("sides", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).default('0'),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const mediaAssets = pgTable("media_assets", {
	id: serial().primaryKey().notNull(),
	filename: varchar({ length: 255 }).notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	byteLength: integer("byte_length").notNull(),
	checksum: varchar({ length: 64 }),
	data: text().notNull(),
	externalUrl: varchar("external_url", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const deliveryZones = pgTable("delivery_zones", {
	id: serial().primaryKey().notNull(),
	zoneName: varchar("zone_name", { length: 100 }).notNull(),
	distanceMinKm: numeric("distance_min_km", { precision: 5, scale:  2 }).default('0').notNull(),
	distanceMaxKm: numeric("distance_max_km", { precision: 5, scale:  2 }).notNull(),
	deliveryPrice: numeric("delivery_price", { precision: 10, scale:  2 }).notNull(),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 20 }).default('admin').notNull(),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	lastActivity: timestamp("last_activity", { mode: 'string' }),
	active: integer().default(1).notNull(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_admin_users_active").using("btree", table.active.asc().nullsLast().op("int4_ops")),
	index("idx_admin_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("admin_users_username_unique").on(table.username),
	unique("admin_users_email_unique").on(table.email),
]);

export const dishCategories = pgTable("dish_categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	displayOrder: integer("display_order").default(1),
	isActive: integer("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("dish_categories_name_key").on(table.name),
]);
export const businessInfo = pgView("business_info", {	id: integer(),
	businessName: varchar("business_name", { length: 100 }),
	tagline: varchar({ length: 200 }),
	description: text(),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 100 }),
	address: text(),
	websiteUrl: varchar("website_url", { length: 255 }),
	businessHours: json("business_hours"),
	tpsRate: numeric("tps_rate", { precision: 5, scale:  3 }),
	tvqRate: numeric("tvq_rate", { precision: 5, scale:  4 }),
	deliveryFee: numeric("delivery_fee", { precision: 10, scale:  2 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}).as(sql`SELECT site_info.id, site_info.business_name, site_info.tagline, site_info.description, site_info.unified_phone AS phone, site_info.unified_email AS email, site_info.unified_address AS address, site_info.website_url, site_info.business_hours, site_info.tps_rate, site_info.tvq_rate, site_info.delivery_fee, site_info.updated_at FROM site_info WHERE site_info.id = 1`);

export const adminDashboardStats = pgView("admin_dashboard_stats", {	metric: text(),
	value: integer(),
	label: text(),
}).as(sql`SELECT 'dishes_count'::text AS metric, count(*)::integer AS value, 'Total plats'::text AS label FROM dishes WHERE dishes.available = 1`);