CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'admin' NOT NULL,
	"last_login" timestamp,
	"last_activity" timestamp,
	"active" integer DEFAULT 1 NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username"),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"image_url" varchar(255),
	"active" integer DEFAULT 1 NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"priority" varchar(20) DEFAULT 'normal',
	"expires_at" timestamp,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_type" varchar(20) NOT NULL,
	"username" varchar(100),
	"action" varchar(100) NOT NULL,
	"table_name" varchar(100),
	"record_id" integer,
	"old_value" json,
	"new_value" json,
	"description" text,
	"ip_address" varchar(50),
	"user_agent" varchar(500),
	"severity" varchar(20) DEFAULT 'info',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catering_decorative_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" varchar(255),
	"image_id" integer,
	"position" varchar(20) DEFAULT 'random' NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catering_menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_fr" varchar(150) NOT NULL,
	"name_en" varchar(150) NOT NULL,
	"description_fr" text,
	"description_en" text,
	"price" numeric(10, 2) NOT NULL,
	"category" varchar(100) NOT NULL,
	"image_url" varchar(255),
	"image_id" integer,
	"display_order" integer DEFAULT 0,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone" varchar(20),
	"subject" varchar(150),
	"message" text NOT NULL,
	"inquiry_type" varchar(50) DEFAULT 'general',
	"status" varchar(20) DEFAULT 'new',
	"admin_notes" text,
	"replied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"message" text NOT NULL,
	"from_type" varchar(20) NOT NULL,
	"from_admin_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"subject" varchar(200) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"unread_by_customer" integer DEFAULT 0 NOT NULL,
	"unread_by_admin" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"closed_by_admin_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'info' NOT NULL,
	"related_order_id" integer,
	"related_order_number" varchar(20),
	"read" integer DEFAULT 0 NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50),
	"dc_id" varchar(20),
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" varchar(255),
	"phone" varchar(20),
	"address" text,
	"city" varchar(100),
	"postal_code" varchar(20),
	"notes" text,
	"total_orders" integer DEFAULT 0,
	"total_spent" numeric(10, 2) DEFAULT '0',
	"last_login" timestamp,
	"last_username_change" timestamp,
	"last_activity" timestamp,
	"active" integer DEFAULT 1 NOT NULL,
	"email_verified" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_username_unique" UNIQUE("username"),
	CONSTRAINT "customers_dc_id_unique" UNIQUE("dc_id"),
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_name" varchar(100) NOT NULL,
	"distance_min_km" numeric(5, 2) DEFAULT '0' NOT NULL,
	"distance_max_km" numeric(5, 2) NOT NULL,
	"delivery_price" numeric(10, 2) NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"category" varchar(50) NOT NULL,
	"image_url" varchar(255),
	"image_id" integer,
	"ingredients" text,
	"allergens" varchar(200),
	"spice_level" varchar(20) DEFAULT 'moyen',
	"available" integer DEFAULT 1 NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"is_takeout" integer DEFAULT 0 NOT NULL,
	"is_catering" integer DEFAULT 0 NOT NULL,
	"preparation_time" integer DEFAULT 30,
	"display_order" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"section_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"customer_id" integer,
	"customer_name" varchar(100) NOT NULL,
	"customer_email" varchar(100) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"event_date" timestamp NOT NULL,
	"event_time" varchar(10) NOT NULL,
	"guests_count" integer NOT NULL,
	"menu_type" varchar(100),
	"location" text,
	"special_requests" text,
	"deposit_amount" numeric(10, 2),
	"total_estimate" numeric(10, 2),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"confirmed_by_admin_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"description" text,
	"event_date" timestamp NOT NULL,
	"event_time" varchar(10),
	"end_date" timestamp,
	"location" varchar(200),
	"address" text,
	"image_url" varchar(255),
	"image_id" integer,
	"gallery_images" json,
	"price" numeric(10, 2),
	"max_guests" integer,
	"current_bookings" integer DEFAULT 0,
	"featured" integer DEFAULT 0 NOT NULL,
	"category" varchar(50) DEFAULT 'autre',
	"status" varchar(50) DEFAULT 'upcoming',
	"contact_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "gallery" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"url" varchar(255) NOT NULL,
	"thumbnail_url" varchar(255),
	"url_id" integer,
	"thumbnail_id" integer,
	"description" text,
	"category" varchar(50) DEFAULT 'plats',
	"display_order" integer DEFAULT 0,
	"active" integer DEFAULT 1 NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"alt_text" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hero_slides" (
	"id" serial PRIMARY KEY NOT NULL,
	"dc_id" varchar(20) NOT NULL,
	"title" varchar(100),
	"media_url" varchar(255),
	"media_id" integer,
	"media_type" varchar(10) DEFAULT 'image' NOT NULL,
	"alt_text" varchar(200),
	"text_content" text,
	"text_position" varchar(20) DEFAULT 'center',
	"logo_url" varchar(255),
	"logo_id" integer,
	"logo_size" varchar(20) DEFAULT 'medium',
	"display_order" integer DEFAULT 0,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hero_slides_dc_id_unique" UNIQUE("dc_id")
);
--> statement-breakpoint
CREATE TABLE "internal_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"dc_id" varchar(20) NOT NULL,
	"from_user_id" integer,
	"from_user_type" varchar(20) NOT NULL,
	"to_user_id" integer,
	"to_user_type" varchar(20) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"related_order_id" integer,
	"related_quote_id" integer,
	"priority" varchar(20) DEFAULT 'normal',
	"status" varchar(20) DEFAULT 'unread',
	"read_at" timestamp,
	"replied_at" timestamp,
	"parent_message_id" integer,
	"attachments" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "internal_messages_dc_id_unique" UNIQUE("dc_id")
);
--> statement-breakpoint
CREATE TABLE "legal_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"meta_description" varchar(300),
	"active" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "legal_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "mailjet_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_key" varchar(255),
	"secret_key" varchar(255),
	"from_email" varchar(100) DEFAULT 'info@douniecuisine.com' NOT NULL,
	"from_name" varchar(100) DEFAULT 'Dounie Cuisine' NOT NULL,
	"is_active" integer DEFAULT 0 NOT NULL,
	"template_order_confirmation" varchar(50),
	"template_welcome" varchar(50),
	"template_contact_form" varchar(50),
	"template_event_booking" varchar(50),
	"template_email_verification" varchar(50),
	"updated_by_admin_id" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"byte_length" integer NOT NULL,
	"checksum" varchar(64),
	"data" text NOT NULL,
	"external_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"dc_id" varchar(20) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"days_of_week" json NOT NULL,
	"recurrence_type" varchar(50) DEFAULT 'weekly' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menu_schedules_dc_id_unique" UNIQUE("dc_id")
);
--> statement-breakpoint
CREATE TABLE "menu_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_fr" varchar(100) NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"color_hex" varchar(7) DEFAULT '#E85D04',
	"icon_name" varchar(50),
	"is_active" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" varchar(100) NOT NULL,
	"sender_id" integer NOT NULL,
	"sender_type" varchar(20) NOT NULL,
	"sender_name" varchar(100) NOT NULL,
	"recipient_id" integer NOT NULL,
	"recipient_type" varchar(20) NOT NULL,
	"subject" varchar(200),
	"content" text NOT NULL,
	"is_read" integer DEFAULT 0 NOT NULL,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_fr" varchar(200) NOT NULL,
	"subject_en" varchar(200) NOT NULL,
	"content_html_fr" text NOT NULL,
	"content_html_en" text NOT NULL,
	"send_condition" varchar(50) NOT NULL,
	"scheduled_date" timestamp,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"recipients_count" integer DEFAULT 0,
	"sent_count" integer DEFAULT 0,
	"opened_count" integer DEFAULT 0,
	"clicked_count" integer DEFAULT 0,
	"created_by_admin_id" integer,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_type" varchar(20) NOT NULL,
	"recipient_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"link" varchar(255),
	"is_read" integer DEFAULT 0 NOT NULL,
	"email_sent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"dish_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"special_requests" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"dc_id" varchar(20),
	"order_number" varchar(20) NOT NULL,
	"customer_id" integer,
	"customer_name" varchar(100) NOT NULL,
	"customer_email" varchar(100) NOT NULL,
	"customer_phone" varchar(20),
	"total_amount" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"delivery_fee" numeric(10, 2) DEFAULT '0',
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50),
	"payment_provider" varchar(50),
	"payment_id" varchar(255),
	"transaction_id" varchar(100),
	"paid_at" timestamp,
	"order_type" varchar(50) NOT NULL,
	"delivery_date" timestamp,
	"delivery_time" varchar(10),
	"delivery_address" text,
	"special_instructions" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_dc_id_unique" UNIQUE("dc_id"),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(255) NOT NULL,
	"customer_id" integer,
	"admin_user_id" integer,
	"user_type" varchar(20) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "popup_announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"image_url" varchar(255),
	"button_text" varchar(100),
	"button_url" varchar(255),
	"display_frequency" varchar(20) DEFAULT 'once',
	"target_audience" varchar(50) DEFAULT 'all',
	"active" integer DEFAULT 1 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"display_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2) DEFAULT '0',
	"max_discount" numeric(10, 2),
	"usage_limit" integer,
	"used_count" integer DEFAULT 0,
	"expiry_date" timestamp,
	"is_active" integer DEFAULT 1 NOT NULL,
	"description" text,
	"created_by_admin_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"dc_id" varchar(20) NOT NULL,
	"order_id" integer NOT NULL,
	"order_dc_id" varchar(20) NOT NULL,
	"customer_id" integer,
	"customer_dc_id" varchar(20),
	"receipt_number" varchar(30) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50),
	"transaction_id" varchar(100),
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_dc_id_unique" UNIQUE("dc_id"),
	CONSTRAINT "receipts_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"order_id" integer,
	"dish_id" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"photos" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"moderated_by_admin_id" integer,
	"moderation_note" text,
	"is_public" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_schedule_id" integer NOT NULL,
	"dish_id" integer NOT NULL,
	"special_price" numeric(10, 2),
	"max_quantity" integer,
	"display_order" integer DEFAULT 0,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(20) DEFAULT 'info',
	"background_color" varchar(50),
	"text_color" varchar(50),
	"link_url" varchar(255),
	"link_text" varchar(100),
	"dismissible" integer DEFAULT 1 NOT NULL,
	"position" varchar(20) DEFAULT 'top',
	"active" integer DEFAULT 1 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_name" varchar(100) NOT NULL,
	"tagline" varchar(200),
	"description" text,
	"logo_url" varchar(255),
	"phone1" varchar(20),
	"phone1_label" varchar(50) DEFAULT 'Principal',
	"phone2" varchar(20),
	"phone2_label" varchar(50) DEFAULT 'Secondaire',
	"phone3" varchar(20),
	"phone3_label" varchar(50) DEFAULT 'Autre',
	"email_primary" varchar(100),
	"email_secondary" varchar(100),
	"email_support" varchar(100),
	"address" text,
	"city" varchar(100),
	"province" varchar(50),
	"postal_code" varchar(20),
	"country" varchar(50) DEFAULT 'Canada',
	"business_hours" json,
	"tps_rate" numeric(5, 3) DEFAULT '0.050',
	"tvq_rate" numeric(5, 4) DEFAULT '0.09975',
	"delivery_fee" numeric(10, 2) DEFAULT '8.50',
	"free_delivery_threshold" numeric(10, 2),
	"delivery_radius_km" numeric(10, 2) DEFAULT '15.00',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text,
	"setting_type" varchar(20) DEFAULT 'text',
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "takeout_menu_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "takeout_menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" integer DEFAULT 0 NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "takeout_section_dishes" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"dish_id" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_name" varchar(100) NOT NULL,
	"client_photo" varchar(255),
	"client_photo_id" integer,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"event_type" varchar(50),
	"event_date" timestamp,
	"location" varchar(100),
	"featured" integer DEFAULT 0 NOT NULL,
	"approved" integer DEFAULT 0 NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
