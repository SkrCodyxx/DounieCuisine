import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building, 
  Mail, 
  FileText, 
  Globe, 
  CreditCard, 
  Settings as SettingsIcon,
  Shield,
  Clock,
  Smartphone,
  Database
} from "lucide-react";

// Import des composants modulaires
import GeneralSettings from "@/components/admin/settings/GeneralSettings";
import ContactSettings from "@/components/admin/settings/ContactSettings";
import BusinessHoursSettings from "@/components/admin/settings/BusinessHoursSettings";
import SocialMediaSettings from "@/components/admin/settings/SocialMediaSettings";
import PaymentSettings from "@/components/admin/settings/PaymentSettings";
import SquareSettings from "@/components/admin/settings/SquareSettings";
import EmailSettings from "@/components/admin/settings/EmailSettings";
import LegalSettings from "@/components/admin/settings/LegalSettings";
import SecuritySettings from "@/components/admin/settings/SecuritySettings";
import SystemSettings from "@/components/admin/settings/SystemSettings";
import MobileSettings from "@/components/admin/settings/MobileSettings";

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuration du Site</h1>
            <p className="text-muted-foreground">
              Gérez tous les paramètres de votre restaurant en toute simplicité
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11 h-auto p-1">
            <TabsTrigger value="general" className="flex items-center gap-2 h-12">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Général</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2 h-12">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2 h-12">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Horaires</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2 h-12">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Réseaux</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2 h-12">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Taxes</span>
            </TabsTrigger>
            <TabsTrigger value="square" className="flex items-center gap-2 h-12">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Square</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2 h-12">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="legal" className="flex items-center gap-2 h-12">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Légal</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 h-12">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2 h-12">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Mobile</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 h-12">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Système</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations Générales
                </CardTitle>
                <CardDescription>
                  Nom du restaurant, description, adresse principale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GeneralSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact & Communications
                </CardTitle>
                <CardDescription>
                  Téléphones, emails, WhatsApp et moyens de contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horaires d'Ouverture
                </CardTitle>
                <CardDescription>
                  Configurez les heures d'ouverture pour chaque jour de la semaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessHoursSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Réseaux Sociaux & Web
                </CardTitle>
                <CardDescription>
                  Facebook, Instagram, site web et liens externes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SocialMediaSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Taxes & Livraison
                </CardTitle>
                <CardDescription>
                  Configuration TPS/TVQ, frais de livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="square" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Configuration Square
                </CardTitle>
                <CardDescription>
                  Gestion des paiements Square (Sandbox/Production)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SquareSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Templates d'Emails
                </CardTitle>
                <CardDescription>
                  Emails automatiques, confirmations, notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pages Légales
                </CardTitle>
                <CardDescription>
                  Conditions d'utilisation, politique de confidentialité, mentions légales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LegalSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité & Accès
                </CardTitle>
                <CardDescription>
                  Paramètres de sécurité, maintenance, accès administrateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecuritySettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Mobile & Application
                </CardTitle>
                <CardDescription>
                  Paramètres mobiles, PWA, notifications push
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MobileSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Système & Performance
                </CardTitle>
                <CardDescription>
                  Cache, performances, maintenance technique
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}