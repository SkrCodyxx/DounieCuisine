import { Badge } from "@/components/ui/badge";
import { Leaf, Wheat, Award, Flame, Fish, Milk, Egg } from "lucide-react";

interface DietaryBadgesProps {
  dietaryTags?: string | string[] | null;
  allergenslist?: string | string[] | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const dietaryConfig: Record<string, { label: string; icon: any; color: string }> = {
  vegetarian: { label: "Végétarien", icon: Leaf, color: "bg-green-100 text-green-800 border-green-300" },
  vegan: { label: "Végétalien", icon: Leaf, color: "bg-green-100 text-green-900 border-green-400" },
  "gluten-free": { label: "Sans gluten", icon: Wheat, color: "bg-amber-100 text-amber-800 border-amber-300" },
  "dairy-free": { label: "Sans lactose", icon: Milk, color: "bg-blue-100 text-blue-800 border-blue-300" },
  halal: { label: "Halal", icon: Award, color: "bg-purple-100 text-purple-800 border-purple-300" },
  kosher: { label: "Casher", icon: Award, color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  "nut-free": { label: "Sans noix", icon: Fish, color: "bg-orange-100 text-orange-800 border-orange-300" },
  spicy: { label: "Épicé", icon: Flame, color: "bg-red-100 text-red-800 border-red-300" },
};

const allergenConfig: Record<string, { label: string; icon: any }> = {
  gluten: { label: "Gluten", icon: Wheat },
  lactose: { label: "Lactose", icon: Milk },
  nuts: { label: "Noix", icon: Fish },
  shellfish: { label: "Fruits de mer", icon: Fish },
  eggs: { label: "Œufs", icon: Egg },
  soy: { label: "Soya", icon: Leaf },
};

export default function DietaryBadges({ 
  dietaryTags, 
  allergenslist, 
  className = "",
  size = "sm" 
}: DietaryBadgesProps) {
  
  const parseTags = (tags: string | string[] | null | undefined): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try {
      return JSON.parse(tags);
    } catch {
      return tags.split(',').map(t => t.trim());
    }
  };

  const dietaryArray = parseTags(dietaryTags);
  const allergensArray = parseTags(allergenslist);

  if (dietaryArray.length === 0 && allergensArray.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Dietary Tags */}
      {dietaryArray.map((tag) => {
        const config = dietaryConfig[tag.toLowerCase()];
        if (!config) return null;

        const Icon = config.icon;
        return (
          <Badge 
            key={tag}
            variant="outline"
            className={`${config.color} ${sizeClasses[size]} flex items-center gap-1 border`}
          >
            <Icon className="w-3 h-3" />
            <span>{config.label}</span>
          </Badge>
        );
      })}

      {/* Allergens Warning */}
      {allergensArray.length > 0 && (
        <Badge 
          variant="outline"
          className={`bg-yellow-50 text-yellow-900 border-yellow-400 ${sizeClasses[size]} flex items-center gap-1`}
          title={`Allergènes: ${allergensArray.map(a => allergenConfig[a.toLowerCase()]?.label || a).join(', ')}`}
        >
          ⚠️ Contient: {allergensArray.slice(0, 2).join(', ')}
          {allergensArray.length > 2 && ` +${allergensArray.length - 2}`}
        </Badge>
      )}
    </div>
  );
}
