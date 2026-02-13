// Helper pour mapper les données de l'API vers les composants React
export function mapSiteInfoApiToForm(apiData: any) {
  if (!apiData) return {};
  
  return {
    // Informations générales
    businessName: apiData.business_name || apiData.businessName || "",
    companyName: apiData.company_name || apiData.companyName || "",
    tagline: apiData.tagline || "",
    description: apiData.description || "",
    logoId: apiData.logo_id || apiData.logoId || null,
    logoVisible: (apiData.logo_visible ?? apiData.logoVisible ?? 1) === 1,
    
    // Adresse
    address: apiData.address || "",
    city: apiData.city || "",
    province: apiData.province || "",
    postalCode: apiData.postal_code || apiData.postalCode || "",
    country: apiData.country || "Canada",
    
    // Contact
    phone1: apiData.phone1 || "",
    phone1Label: apiData.phone1_label || apiData.phone1Label || "Principal",
    phone2: apiData.phone2 || "",
    phone2Label: apiData.phone2_label || apiData.phone2Label || "Secondaire",
    phone3: apiData.phone3 || "",
    phone3Label: apiData.phone3_label || apiData.phone3Label || "Autre",
    whatsapp: apiData.whatsapp_number || apiData.whatsappNumber || apiData.whatsapp || "",
    emailPrimary: apiData.email_primary || apiData.emailPrimary || "",
    emailSecondary: apiData.email_secondary || apiData.emailSecondary || "",
    emailOrders: apiData.email_orders || apiData.emailOrders || apiData.email_support || apiData.emailSupport || "",
    
    // Réseaux sociaux
    facebookUrl: apiData.facebook_url || apiData.facebookUrl || "",
    facebookEnabled: (apiData.facebook_enabled ?? apiData.facebookEnabled ?? 1) === 1,
    instagramUrl: apiData.instagram_url || apiData.instagramUrl || "",
    instagramEnabled: (apiData.instagram_enabled ?? apiData.instagramEnabled ?? 1) === 1,
    twitterUrl: apiData.twitter_url || apiData.twitterUrl || "",
    twitterEnabled: (apiData.twitter_enabled ?? apiData.twitterEnabled ?? 1) === 1,
    youtubeUrl: apiData.youtube_url || apiData.youtubeUrl || "",
    youtubeEnabled: (apiData.youtube_enabled ?? apiData.youtubeEnabled ?? 1) === 1,
    linkedinUrl: apiData.linkedin_url || apiData.linkedinUrl || "",
    linkedinEnabled: (apiData.linkedin_enabled ?? apiData.linkedinEnabled ?? 1) === 1,
    googleMapsUrl: apiData.google_maps_url || apiData.googleMapsUrl || "",
    
    // Horaires d'affaires - construction depuis les champs individuels
    businessHours: apiData.business_hours || apiData.businessHours || {
      monday: apiData.mondayHours || apiData.monday_hours || "",
      tuesday: apiData.tuesdayHours || apiData.tuesday_hours || "",
      wednesday: apiData.wednesdayHours || apiData.wednesday_hours || "",
      thursday: apiData.thursdayHours || apiData.thursday_hours || "",
      friday: apiData.fridayHours || apiData.friday_hours || "",
      saturday: apiData.saturdayHours || apiData.saturday_hours || "",
      sunday: apiData.sundayHours || apiData.sunday_hours || ""
    },
    
    // Taxes et paiements
    tpsRate: apiData.tps_rate || apiData.tpsRate || "5.00",
    tvqRate: apiData.tvq_rate || apiData.tvqRate || "9.975",
    deliveryFee: apiData.delivery_fee || apiData.deliveryFee || "0.00",
    freeDeliveryThreshold: apiData.free_delivery_threshold || apiData.freeDeliveryThreshold || "50.00",
    deliveryRadiusKm: apiData.delivery_radius_km || apiData.deliveryRadiusKm || "15",
    
    // SEO et paramètres système
    metaTitle: apiData.meta_title || apiData.metaTitle || "",
    metaDescription: apiData.meta_description || apiData.metaDescription || "",
    metaKeywords: apiData.meta_keywords || apiData.metaKeywords || "",
    siteUrl: apiData.site_url || apiData.siteUrl || "",
    timezone: apiData.timezone || "America/Toronto",
    
    // Sécurité et fonctionnalités
    maintenanceMode: (apiData.maintenance_mode ?? apiData.maintenanceMode ?? 0) === 1,
    onlineOrderingEnabled: (apiData.online_ordering_enabled ?? apiData.onlineOrderingEnabled ?? 1) === 1,
    reservationsEnabled: (apiData.reservations_enabled ?? apiData.reservationsEnabled ?? 1) === 1,
    newsletterEnabled: (apiData.newsletter_enabled ?? apiData.newsletterEnabled ?? 1) === 1,
    
    // Paiements
    squareEnabled: (apiData.square_enabled ?? apiData.squareEnabled ?? 0) === 1,
    squareApplicationId: apiData.square_application_id || apiData.squareApplicationId || "",
    squareLocationId: apiData.square_location_id || apiData.squareLocationId || "",
    paypalEnabled: (apiData.paypal_enabled ?? apiData.paypalEnabled ?? 0) === 1,
    stripeEnabled: (apiData.stripe_enabled ?? apiData.stripeEnabled ?? 0) === 1,
    
    // Mobile et notifications  
    mobileAppEnabled: (apiData.mobile_app_enabled ?? apiData.mobileAppEnabled ?? 0) === 1,
    pushNotificationsEnabled: (apiData.push_notifications_enabled ?? apiData.pushNotificationsEnabled ?? 1) === 1,
    mobileTheme: apiData.mobile_theme || apiData.mobileTheme || "auto",
    offlineMode: (apiData.offline_mode ?? apiData.offlineMode ?? 0) === 1
  };
}
// Helper pour mapper les données du formulaire vers l'API
export function mapFormToSiteInfoApi(formData: any) {
  if (!formData) return {};
  
  const apiData: any = {};
  
  // Informations générales - seulement si définies
  if (formData.businessName !== undefined) apiData.business_name = formData.businessName;
  if (formData.companyName !== undefined) apiData.company_name = formData.companyName;
  if (formData.tagline !== undefined) apiData.tagline = formData.tagline;
  if (formData.description !== undefined) apiData.description = formData.description;
  if (formData.logoId !== undefined) apiData.logo_id = formData.logoId;
  if (formData.logoVisible !== undefined) apiData.logo_visible = formData.logoVisible ? 1 : 0;
  
  // Adresse
  if (formData.address !== undefined) apiData.address = formData.address;
  if (formData.city !== undefined) apiData.city = formData.city;
  if (formData.province !== undefined) apiData.province = formData.province;
  if (formData.postalCode !== undefined) apiData.postal_code = formData.postalCode;
  if (formData.country !== undefined) apiData.country = formData.country;
  
  // Contact
  if (formData.phone1 !== undefined) apiData.phone1 = formData.phone1;
  if (formData.phone1Label !== undefined) apiData.phone1_label = formData.phone1Label;
  if (formData.phone2 !== undefined) apiData.phone2 = formData.phone2;
  if (formData.phone2Label !== undefined) apiData.phone2_label = formData.phone2Label;
  if (formData.phone3 !== undefined) apiData.phone3 = formData.phone3;
  if (formData.phone3Label !== undefined) apiData.phone3_label = formData.phone3Label;
  if (formData.whatsapp !== undefined) apiData.whatsapp_number = formData.whatsapp;
  if (formData.whatsappNumber !== undefined) apiData.whatsapp_number = formData.whatsappNumber;
  if (formData.emailPrimary !== undefined) apiData.email_primary = formData.emailPrimary;
  if (formData.emailSecondary !== undefined) apiData.email_secondary = formData.emailSecondary;
  if (formData.emailOrders !== undefined) apiData.email_orders = formData.emailOrders;
  if (formData.emailSupport !== undefined) apiData.email_orders = formData.emailSupport;
  
  // Réseaux sociaux
  if (formData.facebookUrl !== undefined) apiData.facebook_url = formData.facebookUrl;
  if (formData.facebookEnabled !== undefined) apiData.facebook_enabled = formData.facebookEnabled ? 1 : 0;
  if (formData.instagramUrl !== undefined) apiData.instagram_url = formData.instagramUrl;
  if (formData.instagramEnabled !== undefined) apiData.instagram_enabled = formData.instagramEnabled ? 1 : 0;
  if (formData.twitterUrl !== undefined) apiData.twitter_url = formData.twitterUrl;
  if (formData.twitterEnabled !== undefined) apiData.twitter_enabled = formData.twitterEnabled ? 1 : 0;
  if (formData.youtubeUrl !== undefined) apiData.youtube_url = formData.youtubeUrl;
  if (formData.youtubeEnabled !== undefined) apiData.youtube_enabled = formData.youtubeEnabled ? 1 : 0;
  if (formData.linkedinUrl !== undefined) apiData.linkedin_url = formData.linkedinUrl;
  if (formData.linkedinEnabled !== undefined) apiData.linkedin_enabled = formData.linkedinEnabled ? 1 : 0;
  if (formData.googleMapsUrl !== undefined) apiData.google_maps_url = formData.googleMapsUrl;
  
  // Horaires d'affaires
  if (formData.businessHours !== undefined) apiData.business_hours = formData.businessHours;
  
  // Horaires individuels (utilisés par BusinessHoursSettings)
  if (formData.mondayHours !== undefined) apiData.mondayHours = formData.mondayHours;
  if (formData.tuesdayHours !== undefined) apiData.tuesdayHours = formData.tuesdayHours;
  if (formData.wednesdayHours !== undefined) apiData.wednesdayHours = formData.wednesdayHours;
  if (formData.thursdayHours !== undefined) apiData.thursdayHours = formData.thursdayHours;
  if (formData.fridayHours !== undefined) apiData.fridayHours = formData.fridayHours;
  if (formData.saturdayHours !== undefined) apiData.saturdayHours = formData.saturdayHours;
  if (formData.sundayHours !== undefined) apiData.sundayHours = formData.sundayHours;
  
  // Taxes et paiements
  if (formData.tpsRate !== undefined) apiData.tps_rate = formData.tpsRate;
  if (formData.tvqRate !== undefined) apiData.tvq_rate = formData.tvqRate;
  if (formData.deliveryFee !== undefined) apiData.delivery_fee = formData.deliveryFee;
  if (formData.freeDeliveryThreshold !== undefined) apiData.free_delivery_threshold = formData.freeDeliveryThreshold;
  if (formData.deliveryRadiusKm !== undefined) apiData.delivery_radius_km = formData.deliveryRadiusKm;
  
  // SEO et paramètres système
  if (formData.metaTitle !== undefined) apiData.meta_title = formData.metaTitle;
  if (formData.metaDescription !== undefined) apiData.meta_description = formData.metaDescription;
  if (formData.metaKeywords !== undefined) apiData.meta_keywords = formData.metaKeywords;
  if (formData.siteUrl !== undefined) apiData.site_url = formData.siteUrl;
  if (formData.timezone !== undefined) apiData.timezone = formData.timezone;
  
  // Sécurité et fonctionnalités
  if (formData.maintenanceMode !== undefined) apiData.maintenance_mode = formData.maintenanceMode ? 1 : 0;
  if (formData.onlineOrderingEnabled !== undefined) apiData.online_ordering_enabled = formData.onlineOrderingEnabled ? 1 : 0;
  if (formData.reservationsEnabled !== undefined) apiData.reservations_enabled = formData.reservationsEnabled ? 1 : 0;
  if (formData.newsletterEnabled !== undefined) apiData.newsletter_enabled = formData.newsletterEnabled ? 1 : 0;
  
  // Paiements
  if (formData.squareEnabled !== undefined) apiData.square_enabled = formData.squareEnabled ? 1 : 0;
  if (formData.squareApplicationId !== undefined) apiData.square_application_id = formData.squareApplicationId;
  if (formData.squareLocationId !== undefined) apiData.square_location_id = formData.squareLocationId;
  if (formData.paypalEnabled !== undefined) apiData.paypal_enabled = formData.paypalEnabled ? 1 : 0;
  if (formData.stripeEnabled !== undefined) apiData.stripe_enabled = formData.stripeEnabled ? 1 : 0;
  
  // Mobile et notifications
  if (formData.mobileAppEnabled !== undefined) apiData.mobile_app_enabled = formData.mobileAppEnabled ? 1 : 0;
  if (formData.pushNotificationsEnabled !== undefined) apiData.push_notifications_enabled = formData.pushNotificationsEnabled ? 1 : 0;
  if (formData.mobileTheme !== undefined) apiData.mobile_theme = formData.mobileTheme;
  if (formData.offlineMode !== undefined) apiData.offline_mode = formData.offlineMode ? 1 : 0;
  
  return apiData;
}