import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserCheck } from "lucide-react";
import AdminUsersManagement from "@/components/admin/AdminUsersManagement";

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("admins");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Administration des comptes et permissions</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Administrateurs
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gestion des Administrateurs
                </CardTitle>
                <CardDescription>
                  Gérez les comptes administrateurs et leurs permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminUsersManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Gestion des Permissions
                </CardTitle>
                <CardDescription>
                  Configurez les permissions par module pour chaque administrateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4" />
                  <p>La gestion fine des permissions sera bientôt disponible.</p>
                  <p className="text-sm mt-2">
                    Les permissions sont actuellement gérées via les rôles administrateur.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </AdminLayout>
  );
}