import React from "react";
import { Badge } from "@/components/ui/badge";

interface ActivityPost {
  id: number;
  title: string;
  shortExcerpt?: string;
  publishedAt: string;
  postType: string;
  category: string;
  imageId?: number;
}

export type GetPostTypeInfo = (postType: string) => {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
};

interface EventFeedListProps {
  posts: ActivityPost[];
  selectedId: number | null;
  onSelect: (post: ActivityPost) => void;
  getPostTypeInfo: GetPostTypeInfo;
}

export default function EventFeedList({ posts, selectedId, onSelect, getPostTypeInfo }: EventFeedListProps) {
  const getImageUrl = (p: ActivityPost) => {
    const postAny = p as any;
    return (postAny.image_id || p.imageId) ? `/api/media/${postAny.image_id || p.imageId}` : null;
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { month: 'short', day: '2-digit' });
  };

  return (
    <section className="border rounded-lg bg-white/80 backdrop-blur-sm overflow-hidden">
      <ul className="divide-y">
        {posts.map((post) => {
          const typeInfo = getPostTypeInfo(post.postType);
          const Icon = typeInfo.icon;
          const active = selectedId === post.id;
          const imageUrl = getImageUrl(post);
          return (
            <li
              key={post.id}
              className={`flex gap-3 p-3 hover:bg-orange-50 cursor-pointer ${active ? 'bg-orange-100/60 ring-1 ring-orange-300' : ''}`}
              onClick={() => onSelect(post)}
            >
              <div className="w-12 shrink-0 flex flex-col items-center">
                <div className="text-xs text-gray-500">{formatDate(post.publishedAt)}</div>
                <Badge className={`${typeInfo.color} border-0 mt-1 whitespace-nowrap`}> 
                  <Icon className="w-3 h-3 mr-1" />{typeInfo.label}
                </Badge>
              </div>
              {imageUrl && (
                <img src={imageUrl} alt="miniature" className="w-16 h-16 rounded object-cover shrink-0" loading="lazy" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 truncate">{post.title}</p>
                {post.shortExcerpt && (
                  <p className="text-sm text-gray-600 line-clamp-2">{post.shortExcerpt}</p>
                )}
                <div className="mt-1 text-xs text-gray-500">{post.category}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
