import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onLearnMore?: () => void;
}

export default function ServiceCard({ icon: Icon, title, description, onLearnMore }: ServiceCardProps) {
  return (
    <Card className="hover-elevate transition-all duration-300">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-6">{description}</p>
        <Button
          variant="outline"
          onClick={onLearnMore}
          data-testid={`button-learn-more-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          En savoir plus
        </Button>
      </CardContent>
    </Card>
  );
}
