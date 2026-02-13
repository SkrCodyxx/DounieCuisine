import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";

interface EventCardProps {
  id?: number;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  price?: number;
  image: string;
  category: string;
  maxGuests?: number;
  currentBookings?: number;
  onBook?: () => void;
  onViewDetails?: () => void;
}

export default function EventCard({
  id,
  title,
  description,
  date,
  time,
  location,
  price,
  image,
  category,
  maxGuests,
  currentBookings,
  onBook,
  onViewDetails,
}: EventCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-300 h-full flex flex-col">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
          {category}
        </Badge>
      </div>
      <CardContent className="p-6 flex-1 flex flex-col">
        <h3 className="text-2xl font-semibold mb-3" data-testid={`text-event-title-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>
        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>
              {date}
              {time && ` • ${time}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{location}</span>
          </div>
          {maxGuests && maxGuests > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>
                {currentBookings || 0} / {maxGuests} places
              </span>
            </div>
          ) : maxGuests === 0 || maxGuests === undefined ? (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>
                Places illimitées ({currentBookings || 0} inscrits)
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t">
          {price !== undefined ? (
            price > 0 ? (
              <span className="text-2xl font-bold text-primary" data-testid={`text-event-price-${price}`}>
                ${price.toFixed(2)} CAD
              </span>
            ) : (
              <span className="text-lg font-semibold text-green-600" data-testid="text-event-free">
                Gratuit
              </span>
            )
          ) : (
            <span className="text-sm text-muted-foreground">Prix sur demande</span>
          )}
          <div className="flex gap-2">
            {onViewDetails && (
              <Button
                variant="outline"
                onClick={onViewDetails}
                data-testid={`button-view-event-${title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                Détails
              </Button>
            )}
            <Button
              onClick={onBook}
              data-testid={`button-book-event-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              Réserver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
