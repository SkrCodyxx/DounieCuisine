import { relations } from "drizzle-orm/relations";
import { mediaAssets, announcements, heroSlides, gallery, events, adminUsers, adminPermissions, dishes, dishSides, sides, testimonials, cateringCategories, cateringItems, cateringItemPrices, newsletters, newsletterSends, orders, emailQueue, dishVariantsNew, siteInfo } from "./schema";

export const announcementsRelations = relations(announcements, ({one}) => ({
	mediaAsset: one(mediaAssets, {
		fields: [announcements.imageId],
		references: [mediaAssets.id]
	}),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({many}) => ({
	announcements: many(announcements),
	heroSlides_mediaId: many(heroSlides, {
		relationName: "heroSlides_mediaId_mediaAssets_id"
	}),
	heroSlides_logoId: many(heroSlides, {
		relationName: "heroSlides_logoId_mediaAssets_id"
	}),
	galleries_mediaId: many(gallery, {
		relationName: "gallery_mediaId_mediaAssets_id"
	}),
	galleries_thumbnailId: many(gallery, {
		relationName: "gallery_thumbnailId_mediaAssets_id"
	}),
	events: many(events),
	testimonials: many(testimonials),
	siteInfos_logoId: many(siteInfo, {
		relationName: "siteInfo_logoId_mediaAssets_id"
	}),
	siteInfos_logoId: many(siteInfo, {
		relationName: "siteInfo_logoId_mediaAssets_id"
	}),
	dishes: many(dishes),
}));

export const heroSlidesRelations = relations(heroSlides, ({one}) => ({
	mediaAsset_mediaId: one(mediaAssets, {
		fields: [heroSlides.mediaId],
		references: [mediaAssets.id],
		relationName: "heroSlides_mediaId_mediaAssets_id"
	}),
	mediaAsset_logoId: one(mediaAssets, {
		fields: [heroSlides.logoId],
		references: [mediaAssets.id],
		relationName: "heroSlides_logoId_mediaAssets_id"
	}),
}));

export const galleryRelations = relations(gallery, ({one}) => ({
	mediaAsset_mediaId: one(mediaAssets, {
		fields: [gallery.mediaId],
		references: [mediaAssets.id],
		relationName: "gallery_mediaId_mediaAssets_id"
	}),
	mediaAsset_thumbnailId: one(mediaAssets, {
		fields: [gallery.thumbnailId],
		references: [mediaAssets.id],
		relationName: "gallery_thumbnailId_mediaAssets_id"
	}),
}));

export const eventsRelations = relations(events, ({one}) => ({
	mediaAsset: one(mediaAssets, {
		fields: [events.imageId],
		references: [mediaAssets.id]
	}),
}));

export const adminPermissionsRelations = relations(adminPermissions, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [adminPermissions.adminUserId],
		references: [adminUsers.id]
	}),
}));

export const adminUsersRelations = relations(adminUsers, ({many}) => ({
	adminPermissions: many(adminPermissions),
}));

export const dishSidesRelations = relations(dishSides, ({one}) => ({
	dish: one(dishes, {
		fields: [dishSides.dishId],
		references: [dishes.id]
	}),
	side: one(sides, {
		fields: [dishSides.sideId],
		references: [sides.id]
	}),
}));

export const dishesRelations = relations(dishes, ({one, many}) => ({
	dishSides: many(dishSides),
	dishVariantsNews: many(dishVariantsNew),
	mediaAsset: one(mediaAssets, {
		fields: [dishes.imageId],
		references: [mediaAssets.id]
	}),
}));

export const sidesRelations = relations(sides, ({many}) => ({
	dishSides: many(dishSides),
}));

export const testimonialsRelations = relations(testimonials, ({one}) => ({
	mediaAsset: one(mediaAssets, {
		fields: [testimonials.clientPhotoId],
		references: [mediaAssets.id]
	}),
}));

export const cateringItemsRelations = relations(cateringItems, ({one, many}) => ({
	cateringCategory: one(cateringCategories, {
		fields: [cateringItems.categoryId],
		references: [cateringCategories.id]
	}),
	cateringItemPrices: many(cateringItemPrices),
}));

export const cateringCategoriesRelations = relations(cateringCategories, ({many}) => ({
	cateringItems: many(cateringItems),
}));

export const cateringItemPricesRelations = relations(cateringItemPrices, ({one}) => ({
	cateringItem: one(cateringItems, {
		fields: [cateringItemPrices.itemId],
		references: [cateringItems.id]
	}),
}));

export const newsletterSendsRelations = relations(newsletterSends, ({one}) => ({
	newsletter: one(newsletters, {
		fields: [newsletterSends.newsletterId],
		references: [newsletters.id]
	}),
}));

export const newslettersRelations = relations(newsletters, ({many}) => ({
	newsletterSends: many(newsletterSends),
}));

export const emailQueueRelations = relations(emailQueue, ({one}) => ({
	order: one(orders, {
		fields: [emailQueue.orderId],
		references: [orders.id]
	}),
}));

export const ordersRelations = relations(orders, ({many}) => ({
	emailQueues: many(emailQueue),
}));

export const dishVariantsNewRelations = relations(dishVariantsNew, ({one}) => ({
	dish: one(dishes, {
		fields: [dishVariantsNew.dishId],
		references: [dishes.id]
	}),
}));

export const siteInfoRelations = relations(siteInfo, ({one}) => ({
	mediaAsset_logoId: one(mediaAssets, {
		fields: [siteInfo.logoId],
		references: [mediaAssets.id],
		relationName: "siteInfo_logoId_mediaAssets_id"
	}),
	mediaAsset_logoId: one(mediaAssets, {
		fields: [siteInfo.logoId],
		references: [mediaAssets.id],
		relationName: "siteInfo_logoId_mediaAssets_id"
	}),
}));