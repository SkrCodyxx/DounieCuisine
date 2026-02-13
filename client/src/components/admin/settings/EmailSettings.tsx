import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import EmailTemplatesAdmin from "../EmailTemplatesAdmin";

export default function EmailSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Paramètres des emails
        </CardTitle>
        <CardDescription>
          Gestion des modèles d'emails et notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <EmailTemplatesAdmin />
      </CardContent>
    </Card>
  );
}