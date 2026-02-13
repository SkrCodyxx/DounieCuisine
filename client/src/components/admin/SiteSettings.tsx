import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  Clock, 
  Phone, 
  Mail, 
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Save,
  RefreshCw,
  DollarSign,
  Search,
  Settings,
  Shield
} from "lucide-react";

// Schema pour la validation
const siteInfoSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  tagline: z.string().max(200).optional().nullable(),
  logoId: z.number().optional().nullable(),
  logoVisible: z.boolean().optional().default(true),
  description: z.string().optional(),
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, "La ville est requise"),
  postalCode: z.string().min(1, "Le code postal est requis"),
  phone: z.string().min(1, "Le téléphone est requis"),
  email: z.string().email("Email invalide"),
  website: z.string().url("URL invalide").optional().or(z.literal("")),

  // Contacts additionnels (affichage voulu: numéros 1/2 et emails multiples)
  phone1: z.string().optional().or(z.literal("")),
  phone1Label: z.string().optional().or(z.literal("")),
  phone2: z.string().optional().or(z.literal("")).nullable(),
  phone2Label: z.string().optional().or(z.literal("")),
  phone3: z.string().optional().or(z.literal("")).nullable(),
  phone3Label: z.string().optional().or(z.literal("")),
  emailSecondary: z.string().email("Email invalide").optional().or(z.literal("")),
  emailSupport: z.string().email("Email invalide").optional().or(z.literal("")),
  
  // Nouveaux champs ajoutés
  currency: z.string().optional().default("$ CAD"),
  defaultLanguage: z.string().optional().default("fr"),
  timezone: z.string().optional().default("America/Montreal"),
  maxCapacity: z.number().optional().nullable(),
  longDescription: z.string().optional().or(z.literal("")),
  acceptsReservations: z.boolean().optional().default(true),
  hasDelivery: z.boolean().optional().default(false),
  hasTakeaway: z.boolean().optional().default(true),

  // Champs manquants importants de la base
  companyName: z.string().max(255).optional().or(z.literal("")),
  whatsappNumber: z.string().max(50).optional().or(z.literal("")),
  country: z.string().max(50).optional().default("Canada"),
  tpsRate: z.string().optional().default("0.050"),
  tvqRate: z.string().optional().default("0.09975"),
  deliveryRadiusKm: z.string().optional().default("15.00"),
  siteUrl: z.string().url().optional().or(z.literal("")),
  adminUrl: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  metaTitle: z.string().max(255).optional().or(z.literal("")),
  metaDescription: z.string().optional().or(z.literal("")),
  metaKeywords: z.string().optional().or(z.literal("")),
  maintenanceMode: z.boolean().optional().default(false),
  onlineOrderingEnabled: z.boolean().optional().default(true),
  reservationsEnabled: z.boolean().optional().default(true),
  newsletterEnabled: z.boolean().optional().default(true),
  
  // Horaires structurés
  businessHours: z.object({
    monday: z.object({ open: z.string().optional(), close: z.string().optional(), closed: z.boolean().optional() }).optional(),
    tuesday: z.object({ open: z.string().optional(), close: z.string().optional(), closed: z.boolean().optional() }).optional(),
    wednesday: z.object({ open: z.string().optional(), close: z.string().optional(), closed: z.boolean().optional() }).optional(),
    thursday: z.object({ open: z.string().optional(), close: z.string().optional(), closed: z.boolean().optional() }).optional(),
    friday: z.object({ open: z.string().optional(), close: z.string().optional(), closed: z.boolean().optional() }).optional(),
    saturday: z.object({ open: z.string().optional(), close: z.string().optional(), closed: z.boolean().optional() }).optional(),
    sunday: z.object({ open: z.string().optional(), close: z.string().optional(), closed: z.boolean().optional() }).optional()
  }).optional(),
  
  // Réseaux sociaux
  facebookUrl: z.string().url("URL Facebook invalide").optional().or(z.literal("")),
  instagramUrl: z.string().url("URL Instagram invalide").optional().or(z.literal("")),
  twitterUrl: z.string().url("URL Twitter invalide").optional().or(z.literal(""))
});

type SiteInfoForm = z.infer<typeof siteInfoSchema>;

interface SiteInfo {
  id: number;
  businessName: string;
  companyName?: string;
  tagline?: string | null;
  logoId?: number | null;
  logoVisible?: number;
  description?: string;
  address: string;
  city: string;
  postalCode: string;
  country?: string;
  phone1?: string | null;
  phone1Label?: string | null;
  phone2?: string | null;
  phone2Label?: string | null;
  phone3?: string | null;
  phone3Label?: string | null;
  whatsappNumber?: string | null;
  emailPrimary?: string | null;
  emailSecondary?: string | null;
  emailSupport?: string | null;
  tpsRate?: string | null;
  tvqRate?: string | null;
  deliveryRadiusKm?: string | null;
  timezone?: string | null;
  siteUrl?: string | null;
  adminUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  maintenanceMode?: boolean;
  onlineOrderingEnabled?: boolean;
  reservationsEnabled?: boolean;
  newsletterEnabled?: boolean;
  businessHours?: {
    monday?: { open?: string; close?: string; closed?: boolean };
    tuesday?: { open?: string; close?: string; closed?: boolean };
    wednesday?: { open?: string; close?: string; closed?: boolean };
    thursday?: { open?: string; close?: string; closed?: boolean };
    friday?: { open?: string; close?: string; closed?: boolean };
    saturday?: { open?: string; close?: string; closed?: boolean };
    sunday?: { open?: string; close?: string; closed?: boolean };
  };
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  pinterestUrl?: string;
  tiktokUrl?: string;
  facebookEnabled?: boolean;
  instagramEnabled?: boolean;
  twitterEnabled?: boolean;
  youtubeEnabled?: boolean;
  linkedinEnabled?: boolean;
  pinterestEnabled?: boolean;
  tiktokEnabled?: boolean;
  whatsappEnabled?: boolean;
  updatedAt: string;
}

export default function SiteSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const { data: siteInfo, isLoading } = useQuery({
    queryKey: ["/api/admin/site-info"],
    queryFn: () => apiRequest("GET", "/api/admin/site-info"),
  });

  const form = useForm<SiteInfoForm>({
    resolver: zodResolver(siteInfoSchema),
    defaultValues: {
      name: "",
      tagline: "",
      logoId: undefined,
      logoVisible: true,
      description: "",
      address: "",
      city: "",
      postalCode: "",
      phone: "",
      email: "",
      website: "",
      phone1: "",
      phone1Label: "",
      phone2: "",
      phone2Label: "",
      phone3: "",
      phone3Label: "",
      emailSecondary: "",
      emailSupport: "",
      
      // Nouveaux champs
      companyName: "",
      whatsappNumber: "",
      country: "",
      tpsRate: "",
      tvqRate: "",
      deliveryRadiusKm: "",
      timezone: "",
      siteUrl: "",
      adminUrl: "",
      youtubeUrl: "",
      linkedinUrl: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      maintenanceMode: false,
      onlineOrderingEnabled: false,
      reservationsEnabled: false,
      newsletterEnabled: false,
      
      businessHours: {
        monday: { open: "", close: "", closed: false },
        tuesday: { open: "", close: "", closed: false },
        wednesday: { open: "", close: "", closed: false },
        thursday: { open: "", close: "", closed: false },
        friday: { open: "", close: "", closed: false },
        saturday: { open: "", close: "", closed: false },
        sunday: { open: "", close: "", closed: false }
      },
      facebookUrl: "",
      instagramUrl: "",
      twitterUrl: ""
    }
  });
  
  // Track if form has been initialized to prevent re-render loops
  const isInitialized = useRef(false);

  // Remplir le formulaire quand les données arrivent (UNE SEULE FOIS)
  useEffect(() => {
    if (siteInfo && !isInitialized.current) {
      isInitialized.current = true;
      form.reset({
        name: siteInfo.businessName || "",
        tagline: siteInfo.tagline || "",
        logoId: siteInfo.logoId || undefined,
        logoVisible: siteInfo.logoVisible === 0 ? false : true,
        description: siteInfo.description || "",
        address: (siteInfo as any).address || (siteInfo as any).unifiedAddress || "",
        city: siteInfo.city || "",
        postalCode: siteInfo.postalCode || "",
        phone: (siteInfo as any).phone || (siteInfo as any).unifiedPhone || (siteInfo as any).phone1 || "",
        email: (siteInfo as any).email || (siteInfo as any).emailPrimary || "",
        website: (siteInfo as any).website || (siteInfo as any).websiteUrl || (siteInfo as any).siteUrl || "",
        phone1: (siteInfo as any).phone1 || "",
        phone1Label: (siteInfo as any).phone1_label || (siteInfo as any).phone1Label || "",
        phone2: (siteInfo as any).phone2 || "",
        phone2Label: (siteInfo as any).phone2_label || (siteInfo as any).phone2Label || "",
        phone3: (siteInfo as any).phone3 || "",
        phone3Label: (siteInfo as any).phone3_label || (siteInfo as any).phone3Label || "",
        emailSecondary: (siteInfo as any).email_secondary || (siteInfo as any).emailSecondary || "",
        emailSupport: (siteInfo as any).email_support || (siteInfo as any).emailSupport || "",
        
        // Nouveaux champs mappés
        companyName: (siteInfo as any).company_name || (siteInfo as any).companyName || "",
        whatsappNumber: (siteInfo as any).whatsapp_number || (siteInfo as any).whatsappNumber || "",
        country: (siteInfo as any).country || "",
        tpsRate: (siteInfo as any).tps_rate || (siteInfo as any).tpsRate || "",
        tvqRate: (siteInfo as any).tvq_rate || (siteInfo as any).tvqRate || "",
        deliveryRadiusKm: (siteInfo as any).delivery_radius_km || (siteInfo as any).deliveryRadiusKm || "",
        timezone: (siteInfo as any).timezone || "",
        siteUrl: (siteInfo as any).site_url || (siteInfo as any).siteUrl || "",
        adminUrl: (siteInfo as any).admin_url || (siteInfo as any).adminUrl || "",
        youtubeUrl: (siteInfo as any).youtube_url || (siteInfo as any).youtubeUrl || "",
        linkedinUrl: (siteInfo as any).linkedin_url || (siteInfo as any).linkedinUrl || "",
        metaTitle: (siteInfo as any).meta_title || (siteInfo as any).metaTitle || "",
        metaDescription: (siteInfo as any).metaDescription || (siteInfo as any).metaDescription || "",
        metaKeywords: (siteInfo as any).meta_keywords || (siteInfo as any).metaKeywords || "",
        maintenanceMode: (siteInfo as any).maintenance_mode ?? (siteInfo as any).maintenanceMode ?? false,
        onlineOrderingEnabled: (siteInfo as any).online_ordering_enabled ?? (siteInfo as any).onlineOrderingEnabled ?? false,
        reservationsEnabled: (siteInfo as any).reservations_enabled ?? (siteInfo as any).reservationsEnabled ?? false,
        newsletterEnabled: (siteInfo as any).newsletter_enabled ?? (siteInfo as any).newsletterEnabled ?? false,
        
        businessHours: siteInfo.businessHours || {
          monday: { open: "11:00", close: "22:00", closed: false },
          tuesday: { open: "11:00", close: "22:00", closed: false },
          wednesday: { open: "11:00", close: "22:00", closed: false },
          thursday: { open: "11:00", close: "22:00", closed: false },
          friday: { open: "11:00", close: "22:00", closed: false },
          saturday: { open: "11:00", close: "22:00", closed: false },
          sunday: { open: "11:00", close: "22:00", closed: false }
        },
        facebookUrl: siteInfo.facebookUrl || "",
        instagramUrl: siteInfo.instagramUrl || "",
        twitterUrl: siteInfo.twitterUrl || ""
      });
    }
  }, [siteInfo]); // ✅ Retiré 'form' des dépendances pour éviter boucle re-render

  // Fetch media library for logo selection
  const { data: mediaLibrary } = useQuery({
    queryKey: ["/api/admin/media"],
    queryFn: () => apiRequest("GET", "/api/admin/media"),
  });

  // Upload handler for logo - uses the upload-media endpoint
  const uploadLogo = async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/admin/upload-media', { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
  };

  const updateMutation = useMutation({
    mutationFn: async (data: SiteInfoForm) => {
      // Transformer les données de camelCase vers snake_case pour l'API
      const payload: any = {};
      
      // Mapping des champs
      const fieldMap: Record<string, string> = {
        name: 'business_name',
        companyName: 'company_name',
        email: 'email_primary',
        emailSecondary: 'email_secondary',
        emailSupport: 'email_support',
        phone: 'phone1',
        whatsappNumber: 'whatsapp_number',
        phone1Label: 'phone1_label',
        phone2Label: 'phone2_label',
        phone3Label: 'phone3_label',
        postalCode: 'postal_code',
        siteUrl: 'site_url',
        adminUrl: 'admin_url',
        facebookUrl: 'facebook_url',
        instagramUrl: 'instagram_url',
        twitterUrl: 'twitter_url',
        youtubeUrl: 'youtube_url',
        linkedinUrl: 'linkedin_url',
        metaTitle: 'meta_title',
        metaDescription: 'metaDescription',
        metaKeywords: 'meta_keywords',
        businessHours: 'business_hours',
        logoVisible: 'logo_visible',
        deliveryRadiusKm: 'delivery_radius_km',
        tpsRate: 'tps_rate',
        tvqRate: 'tvq_rate',
        maintenanceMode: 'maintenance_mode',
        onlineOrderingEnabled: 'online_ordering_enabled',
        reservationsEnabled: 'reservations_enabled',
        newsletterEnabled: 'newsletter_enabled',
        logoId: 'logo_id',
        website: 'site_url'
      };
      
      // Convertir tous les champs
      Object.keys(data).forEach(key => {
        const snakeKey = fieldMap[key] || key;
        payload[snakeKey] = data[key as keyof SiteInfoForm];
      });
      
      console.log('🔵 SiteSettings - Données envoyées:', payload);
      
      return apiRequest("PATCH", "/api/admin/site-info", payload);
    },
    onSuccess: () => {
      toast({ title: "✅ Informations du site mises à jour avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-info"] }); // Invalider aussi la version publique
    },
    onError: (error: any) => {
      console.error('❌ Erreur mise à jour:', error);
      toast({ 
        title: "❌ Erreur lors de la mise à jour", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: SiteInfoForm) => {
    console.log('🟢 SiteSettings - Formulaire soumis:', data);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration du Site</h2>
        <p className="text-muted-foreground">
          Gérez les informations de votre restaurant et restaurant
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horaires
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Réseaux Sociaux
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO & Tech
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations Générales
                </CardTitle>
                <CardDescription>
                  Nom, description et coordonnées de votre restaurant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nom du Restaurant</label>
                    <Input
                      {...form.register("name")}
                      placeholder=""
                      className="mt-1"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      {...form.register("email")}
                      type="email"
                      placeholder=""
                      className="mt-1"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    {...form.register("description")}
                    placeholder=""
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Téléphone</label>
                    <Input
                      {...form.register("phone")}
                      placeholder=""
                      className="mt-1"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Site Web</label>
                    <Input
                      {...form.register("website")}
                      placeholder=""
                      className="mt-1"
                    />
                    {form.formState.errors.website && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.website.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Coordonnées détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Téléphone 1 (libellé)</label>
                    <Input {...form.register("phone1Label")} placeholder="" className="mt-1" />
                    <Input {...form.register("phone1")} placeholder="" className="mt-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Téléphone 2 (libellé)</label>
                    <Input {...form.register("phone2Label")} placeholder="" className="mt-1" />
                    <Input {...form.register("phone2")} placeholder="" className="mt-2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Téléphone 3 (libellé)</label>
                    <Input {...form.register("phone3Label")} placeholder="" className="mt-1" />
                    <Input {...form.register("phone3")} placeholder="" className="mt-2" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email secondaire</label>
                    <Input {...form.register("emailSecondary")} type="email" placeholder="" className="mt-1" />
                    {form.formState.errors.emailSecondary && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.emailSecondary.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email support</label>
                    <Input {...form.register("emailSupport")} type="email" placeholder="" className="mt-1" />
                    {form.formState.errors.emailSupport && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.emailSupport.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Adresse</label>
                  <Input
                    {...form.register("address")}
                    placeholder=""
                    className="mt-1"
                  />
                  {form.formState.errors.address && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Ville</label>
                    <Input
                      {...form.register("city")}
                      placeholder=""
                      className="mt-1"
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Code Postal</label>
                    <Input
                      {...form.register("postalCode")}
                      placeholder=""
                      className="mt-1"
                    />
                    {form.formState.errors.postalCode && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hero / Logo settings */}
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Hero & Logo</h4>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Afficher le logo</label>
                    <input type="checkbox" {...form.register('logoVisible')} />
                  </div>

                  <div className="mt-3">
                    <label className="text-sm font-medium">Tagline / Slogan</label>
                    <Input {...form.register('tagline')} placeholder="" className="mt-1" />
                  </div>

                  <div className="mt-3">
                    <label className="text-sm font-medium">Logo (sélectionner depuis la bibliothèque ou téléverser)</label>
                    <div className="flex items-center gap-3 mt-2">
                      <select
                        {...form.register('logoId', { valueAsNumber: true })}
                        className="border rounded px-2 py-1"
                      >
                        <option value={""}>-- Aucune sélection --</option>
                        {mediaLibrary && Array.isArray(mediaLibrary) && mediaLibrary.map((m: any) => (
                          <option key={m.id} value={m.id}>{m.filename}</option>
                        ))}
                      </select>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          try {
                            const uploaded = await uploadLogo(f);
                            // set logoId to uploaded id
                            form.setValue('logoId', uploaded.id);
                            // refresh media query
                            // eslint-disable-next-line @typescript-eslint/no-floating-promises
                            (async () => queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] }))();
                            toast({ title: 'Logo téléversé', description: uploaded.filename });
                          } catch (err: any) {
                            toast({ title: 'Échec du téléversement', description: err.message, variant: 'destructive' });
                          }
                        }}
                      />
                    </div>
                    {form.watch('logoId') && (
                      <div className="mt-2">
                        <img src={mediaLibrary?.find((m: any) => m.id === Number(form.watch('logoId')))?.externalUrl || (`/api/media/${form.watch('logoId')}`)} alt="logo" className="h-16 object-contain" />
                      </div>
                    )}
                  </div>
                  
                  {/* Champs supplémentaires pour page générale */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium">Devise</label>
                      <Input {...form.register('currency')} placeholder="$ CAD" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Langue par défaut</label>
                      <select {...form.register('defaultLanguage')} className="w-full border rounded px-3 py-2 mt-1">
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Timezone</label>
                      <select {...form.register('timezone')} className="w-full border rounded px-3 py-2 mt-1">
                        <option value="America/Montreal">America/Montreal</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Capacité maximum</label>
                      <Input {...form.register('maxCapacity', { valueAsNumber: true })} type="number" placeholder="100" className="mt-1" />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="text-sm font-medium">Description longue / À propos</label>
                    <Textarea {...form.register('longDescription')} placeholder="" className="mt-1" rows={4} />
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" {...form.register('acceptsReservations')} />
                      <span className="text-sm">Accepte les réservations</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" {...form.register('hasDelivery')} />
                      <span className="text-sm">Propose la livraison</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" {...form.register('hasTakeaway')} />
                      <span className="text-sm">Propose à emporter</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horaires d'Ouverture - Version Simplifiée
                </CardTitle>
                <CardDescription>
                  Configuration simple avec toggles pour l'activation/désactivation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Presets simplifiés */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold mb-3 text-blue-800 flex items-center gap-2">
                    🚀 Application rapide d'horaires
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-blue-50 border-blue-300 shadow-md"
                      onClick={() => {
                        const restaurantHours = { open: "11:00", close: "22:00", closed: false };
                        ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].forEach(day => {
                          (form.setValue as any)(`businessHours.${day}`, restaurantHours);
                        });
                        (form.setValue as any)(`businessHours.monday`, { open: "", close: "", closed: true });
                        toast({ title: "✅ Horaires restaurant", description: "Fermé lundi, 11h-22h autres jours" });
                      }}
                    >
                      🍽️ Restaurant Standard
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-green-50 border-green-300 shadow-md"
                      onClick={() => {
                        const standardHours = { open: "09:00", close: "18:00", closed: false };
                        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].forEach(day => {
                          (form.setValue as any)(`businessHours.${day}`, standardHours);
                        });
                        toast({ title: "✅ Horaires standards", description: "9h-18h tous les jours" });
                      }}
                    >
                      🏢 Standard 9h-18h
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="shadow-md"
                      onClick={() => {
                        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].forEach(day => {
                          (form.setValue as any)(`businessHours.${day}`, { open: "", close: "", closed: true });
                        });
                        toast({ title: "🚫 Tout fermé", description: "Tous les jours fermés" });
                      }}
                    >
                      🚫 Tout fermer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].forEach(day => {
                          (form.setValue as any)(`businessHours.${day}`, { open: "", close: "", closed: true });
                        });
                        toast({ title: "Tout fermé", description: "Tous les jours fermés" });
                      }}
                    >
                      🚫 Tout fermer
                    </Button>
                  </div>
                </div>

                {/* Horaires simplifiés par jour */}
                <div className="space-y-4">
                  {[
                    { key: "monday", label: "Lundi", emoji: "🔵" },
                    { key: "tuesday", label: "Mardi", emoji: "🟢" },
                    { key: "wednesday", label: "Mercredi", emoji: "🟡" },
                    { key: "thursday", label: "Jeudi", emoji: "🟠" },
                    { key: "friday", label: "Vendredi", emoji: "🔴" },
                    { key: "saturday", label: "Samedi", emoji: "🟣" },
                    { key: "sunday", label: "Dimanche", emoji: "⚪" }
                  ].map(({ key, label, emoji }) => {
                    const isClosed = (form.watch as any)(`businessHours.${key}.closed`);
                    const openTime = (form.watch as any)(`businessHours.${key}.open`);
                    const closeTime = (form.watch as any)(`businessHours.${key}.close`);
                    
                    return (
                      <div key={key} className={`p-6 border-2 rounded-xl transition-all duration-200 ${
                        isClosed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                      } hover:shadow-md`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{emoji}</span>
                            <div>
                              <span className="font-bold text-lg">{label}</span>
                              <div className="text-sm text-gray-600">
                                {isClosed ? '🚫 Fermé' : (openTime && closeTime ? `⏰ ${openTime} - ${closeTime}` : '⚠️ Horaires à définir')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Grand Toggle Ouvert/Fermé */}
                            <Button
                              type="button"
                              variant={isClosed ? "destructive" : "default"}
                              size="lg"
                              onClick={() => {
                                const newClosed = !isClosed;
                                (form.setValue as any)(`businessHours.${key}.closed`, newClosed);
                                if (newClosed) {
                                  (form.setValue as any)(`businessHours.${key}.open`, "");
                                  (form.setValue as any)(`businessHours.${key}.close`, "");
                                } else {
                                  (form.setValue as any)(`businessHours.${key}.open`, "11:00");
                                  (form.setValue as any)(`businessHours.${key}.close`, "22:00");
                                }
                              }}
                              className="min-w-32 text-lg font-bold shadow-lg"
                            >
                              {isClosed ? "🚫 FERMÉ" : "✅ OUVERT"}
                            </Button>
                            
                            {/* Horaires si ouvert */}
                            {!isClosed && (
                              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm">
                                <div className="text-center">
                                  <label className="text-xs text-gray-500 block mb-1">Ouverture</label>
                                  <Input
                                    value={openTime || ""}
                                    onChange={(e) => (form.setValue as any)(`businessHours.${key}.open`, e.target.value)}
                                    placeholder="11:00"
                                    className="w-24 text-center font-bold text-lg"
                                    type="time"
                                  />
                                </div>
                                <span className="text-2xl font-bold text-blue-500 mx-2">→</span>
                                <div className="text-center">
                                  <label className="text-xs text-gray-500 block mb-1">Fermeture</label>
                                  <Input
                                    value={closeTime || ""}
                                    onChange={(e) => (form.setValue as any)(`businessHours.${key}.close`, e.target.value)}
                                    placeholder="22:00"
                                    className="w-24 text-center font-bold text-lg"
                                    type="time"
                                  />
                                </div>
                                
                                {/* Presets rapides */}
                                <div className="flex flex-col gap-1 ml-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="px-3 py-1 text-xs"
                                    onClick={() => {
                                      (form.setValue as any)(`businessHours.${key}.open`, "11:00");
                                      (form.setValue as any)(`businessHours.${key}.close`, "22:00");
                                    }}
                                  >
                                    11h-22h
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="px-3 py-1 text-xs"
                                    onClick={() => {
                                      (form.setValue as any)(`businessHours.${key}.open`, "09:00");
                                      (form.setValue as any)(`businessHours.${key}.close`, "18:00");
                                    }}
                                  >
                                    9h-18h
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Aperçu de l'horaire */}
                        <div className="mt-2 text-xs text-muted-foreground">
                          {isClosed ? (
                            <span className="text-red-600 font-medium">🚫 Restaurant fermé ce jour</span>
                          ) : (
                            openTime && closeTime ? (
                              <span className="text-green-600 font-medium">
                                🕐 Ouvert de {openTime} à {closeTime}
                                {openTime && closeTime && (
                                  (() => {
                                    const start = parseInt(openTime.split(':')[0]);
                                    const end = parseInt(closeTime.split(':')[0]);
                                    const duration = end > start ? end - start : (24 - start) + end;
                                    return ` (${duration}h de service)`;
                                  })()
                                )}
                              </span>
                            ) : (
                              <span className="text-orange-600">⚠️ Veuillez définir les horaires d'ouverture</span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Résumé des horaires */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    📋 Résumé de vos horaires d'ouverture
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {[
                      { key: "monday", label: "Lun" },
                      { key: "tuesday", label: "Mar" },
                      { key: "wednesday", label: "Mer" },
                      { key: "thursday", label: "Jeu" },
                      { key: "friday", label: "Ven" },
                      { key: "saturday", label: "Sam" },
                      { key: "sunday", label: "Dim" }
                    ].map(({ key, label }) => {
                      const isClosed = (form.watch as any)(`businessHours.${key}.closed`);
                      const openTime = (form.watch as any)(`businessHours.${key}.open`);
                      const closeTime = (form.watch as any)(`businessHours.${key}.close`);
                      
                      return (
                        <div key={key} className="flex justify-between items-center py-1">
                          <span className="font-medium">{label}:</span>
                          <span className={isClosed ? "text-red-600" : "text-green-600"}>
                            {isClosed ? "Fermé" : openTime && closeTime ? `${openTime} - ${closeTime}` : "À définir"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Réseaux Sociaux
                </CardTitle>
                <CardDescription>
                  Ajoutez les liens vers vos profils sur les réseaux sociaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook
                  </label>
                  <Input
                    {...form.register("facebookUrl")}
                    placeholder=""
                    className="mt-1"
                  />
                  {form.formState.errors.facebookUrl && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.facebookUrl.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    Instagram
                  </label>
                  <Input
                    {...form.register("instagramUrl")}
                    placeholder=""
                    className="mt-1"
                  />
                  {form.formState.errors.instagramUrl && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.instagramUrl.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-blue-400" />
                    Twitter
                  </label>
                  <Input
                    {...form.register("twitterUrl")}
                    placeholder=""
                    className="mt-1"
                  />
                  {form.formState.errors.twitterUrl && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.twitterUrl.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="h-4 w-4 text-red-600">▶</span>
                    YouTube
                  </label>
                  <Input
                    {...form.register("youtubeUrl")}
                    placeholder=""
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="h-4 w-4 text-blue-700">💼</span>
                    LinkedIn
                  </label>
                  <Input
                    {...form.register("linkedinUrl")}
                    placeholder=""
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="h-4 w-4 text-green-500">📱</span>
                    WhatsApp
                  </label>
                  <Input
                    {...form.register("whatsappNumber")}
                    placeholder=""
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Paramètres Business
                </CardTitle>
                <CardDescription>
                  Configuration des taxes, livraison et paramètres commerciaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nom de l'entreprise</label>
                    <Input
                      {...form.register("companyName")}
                      placeholder=""
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Pays</label>
                    <Input
                      {...form.register("country")}
                      placeholder=""
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Taux TPS</label>
                    <Input
                      {...form.register("tpsRate")}
                      placeholder=""
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Taux TVQ</label>
                    <Input
                      {...form.register("tvqRate")}
                      placeholder=""
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rayon de livraison (km)</label>
                    <Input
                      {...form.register("deliveryRadiusKm")}
                      placeholder=""
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Fuseau horaire</label>
                  <select {...form.register("timezone")} className="w-full border rounded px-3 py-2 mt-1">
                    <option value="America/Toronto">America/Toronto</option>
                    <option value="America/Montreal">America/Montreal</option>
                    <option value="America/Vancouver">America/Vancouver</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Fonctionnalités</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" {...form.register("onlineOrderingEnabled")} />
                      <label className="text-sm">Commandes en ligne</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" {...form.register("reservationsEnabled")} />
                      <label className="text-sm">Réservations</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" {...form.register("newsletterEnabled")} />
                      <label className="text-sm">Newsletter</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" {...form.register("maintenanceMode")} />
                      <label className="text-sm text-red-600">Mode maintenance</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SEO & Paramètres Techniques
                </CardTitle>
                <CardDescription>
                  Configuration du référencement et des URLs du site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">URL du site</label>
                    <Input
                      {...form.register("siteUrl")}
                      placeholder=""
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">URL admin</label>
                    <Input
                      {...form.register("adminUrl")}
                      placeholder=""
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Titre SEO</label>
                  <Input
                    {...form.register("metaTitle")}
                    placeholder=""
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description SEO</label>
                  <Textarea
                    {...form.register("metaDescription")}
                    placeholder=""
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Mots-clés SEO</label>
                  <Input
                    {...form.register("metaKeywords")}
                    placeholder=""
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {siteInfo && (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Dernière modification : {new Date(siteInfo.updatedAt).toLocaleDateString('fr-FR')}
                </>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="min-w-32"
            >
              {updateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </Tabs>
      </form>

      {/* Aperçu des informations */}
      {siteInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu Public</CardTitle>
            <CardDescription>
              Voici comment vos informations apparaissent aux visiteurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg">{siteInfo.businessName}</h3>
                <p className="text-muted-foreground text-sm">{siteInfo.description}</p>
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{siteInfo.address}, {siteInfo.city} {siteInfo.postalCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{siteInfo.phone1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{siteInfo.emailPrimary}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Horaires d'ouverture</h4>
                <div className="text-sm space-y-1">
                  {[
                    { key: "monday", label: "Lundi" },
                    { key: "tuesday", label: "Mardi" },
                    { key: "wednesday", label: "Mercredi" },
                    { key: "thursday", label: "Jeudi" },
                    { key: "friday", label: "Vendredi" },
                    { key: "saturday", label: "Samedi" },
                    { key: "sunday", label: "Dimanche" }
                  ].map(({ key, label }) => {
                    const hours = (siteInfo as any).businessHours?.[key];
                    const legacyKey = `${key}Hours` as keyof SiteInfo;
                    const fallbackHours = siteInfo[legacyKey as keyof SiteInfo] as string;
                    
                    let displayHours = "Non défini";
                    if (hours) {
                      if (hours.closed) {
                        displayHours = "Fermé";
                      } else if (hours.open && hours.close) {
                        displayHours = `${hours.open} - ${hours.close}`;
                      }
                    } else if (fallbackHours) {
                      displayHours = fallbackHours;
                    }
                    
                    return (
                      <div key={key} className="flex justify-between">
                        <span>{label}:</span>
                        <span>{displayHours}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}