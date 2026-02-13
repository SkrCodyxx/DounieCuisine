import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Star, MapPin, Calendar, Users, Heart, Share2, Download, Phone } from "lucide-react";

export interface ActivityPost {
  id: number;
  title: string;
  slug: string;
  description?: string;
  activityDate?: string;
  publishedAt: string;
  location?: string;
  imageId?: number;
  mediaAttachments?: any;
  postType: string;
  category: string;
  price?: string;
  isFree?: boolean;
  maxParticipants?: number;
  currentReservations?: number;
  requiresReservation?: boolean;
  reservationDeadline?: string;
  featured: number;
  isPinned: boolean;
}

export type GetPostTypeInfo = (postType: string) => {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
};

interface EventPreviewProps {
  post: ActivityPost | null;
  getPostTypeInfo: GetPostTypeInfo;
  getPriceDisplay: (post: ActivityPost) => string;
  formatDate: (date: string) => string;
  formatActivityDate: (date?: string) => string | null;
  onReserve: (post: ActivityPost) => void;
}

export default function EventPreview({ post, getPostTypeInfo, getPriceDisplay, formatDate, formatActivityDate, onReserve }: EventPreviewProps) {
  if (!post) {
    return (
      <div className="hidden lg:flex items-center justify-center h-full text-gray-500">
        Sélectionnez un élément du fil pour voir les détails ici.
      </div>
    );
  }

  const typeInfo = getPostTypeInfo(post.postType);
  const Icon = typeInfo.icon;
  const imageUrl = (post as any).image_id || post.imageId ? `/api/media/${(post as any).image_id || post.imageId}` : null;
  const availableSpots = post.maxParticipants != null
    ? Math.max(0, post.maxParticipants - (post.currentReservations || 0))
    : null;

  return (
    <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-auto">
      <Card className="bg-white/90 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${typeInfo.color} border-0`}>
                <Icon className="w-3 h-3 mr-1" />
                {typeInfo.label}
              </Badge>
              {post.isPinned && (
                <Badge variant="default" className="bg-orange-600 text-white">
                  <Star className="w-3 h-3 mr-1" /> Épinglé
                </Badge>
              )}
              {post.featured === 1 && (
                <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                  <Star className="w-3 h-3 mr-1" /> À la une
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">{formatDate(post.publishedAt)}</div>
          </div>
          <CardTitle className="text-2xl text-gray-800">{post.title}</CardTitle>
          {post.description && (
            <CardDescription className="text-base text-gray-600 line-clamp-3">
              {post.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {imageUrl && (
            <div className="mb-4">
              <img src={imageUrl} alt={post.title} className="w-full h-56 object-cover rounded" loading="lazy" />
            </div>
          )}

          {(post.activityDate || post.location) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm">
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Détails
              </h4>
              <div className="space-y-2">
                {post.activityDate && (
                  <div className="flex items-center gap-2 text-orange-700">
                    <CalendarDays className="w-4 h-4" />
                    <span>{formatActivityDate(post.activityDate)}</span>
                  </div>
                )}
                {post.location && (
                  <div className="flex items-center gap-2 text-orange-700">
                    <MapPin className="w-4 h-4" />
                    <span>{post.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(post.requiresReservation || post.price) && (
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 mb-1">{post.requiresReservation ? 'Réservation' : 'Information'}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-orange-600">{getPriceDisplay(post)}</span>
                    {availableSpots !== null && (
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Users className="w-4 h-4" /> {availableSpots} places
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {post.requiresReservation ? (
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white" disabled={availableSpots === 0} onClick={() => onReserve(post)}>
                      {availableSpots === 0 ? 'Complet' : 'Réserver'}
                    </Button>
                  ) : (
                    <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white" onClick={() => (window.location.href = '/contact')}>
                      <Phone className="w-4 h-4 mr-2" /> Nous contacter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                <Heart className="w-4 h-4 mr-1" /> J'aime
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                <Share2 className="w-4 h-4 mr-1" /> Partager
              </Button>
            </div>
            {post.mediaAttachments && (
              <Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                <Download className="w-4 h-4 mr-1" /> Télécharger
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
