import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  clientName: string;
  clientPhoto?: string;
  rating: number;
  comment: string;
  eventType?: string;
}

export default function TestimonialCard({
  clientName,
  clientPhoto,
  rating,
  comment,
  eventType,
}: TestimonialCardProps) {
  const initials = (clientName || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < rating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <p className="text-muted-foreground mb-6 flex-1 italic">
          "{comment}"
        </p>
        <div className="flex items-center gap-3 mt-auto">
          <Avatar>
            {clientPhoto && <AvatarImage src={clientPhoto} alt={clientName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold" data-testid={`text-client-name-${clientName.toLowerCase().replace(/\s+/g, "-")}`}>
              {clientName}
            </p>
            {eventType && (
              <p className="text-sm text-muted-foreground">{eventType}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
