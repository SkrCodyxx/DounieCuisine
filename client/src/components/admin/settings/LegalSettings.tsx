import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import LegalPagesAdmin from "../LegalPagesAdmin";

export default function LegalSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Paramètres légaux
        </CardTitle>
        <CardDescription>
          Gestion des pages légales (politique de confidentialité, conditions d'utilisation, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <LegalPagesAdmin />
      </CardContent>
    </Card>
  );
}