import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export type PostTypeKey =
  | "activity"
  | "announcement"
  | "promotion"
  | "menu_update"
  | "opening_hours"
  | "special_event";

export interface FiltersState {
  search: string;
  postTypes: Record<PostTypeKey, boolean>;
  category: string | "all";
  onlyUpcoming: boolean;
  requiresReservation: boolean;
  freeOnly: boolean;
}

interface FiltersSidebarProps {
  filters: FiltersState;
  setFilters: (updater: (prev: FiltersState) => FiltersState) => void;
  categories: string[];
  counts?: Partial<Record<PostTypeKey, number>>;
}

export default function FiltersSidebar({ filters, setFilters, categories, counts }: FiltersSidebarProps) {
  const toggleType = (key: PostTypeKey) => {
    setFilters((prev) => ({
      ...prev,
      postTypes: { ...prev.postTypes, [key]: !prev.postTypes[key] },
    }));
  };

  return (
    <aside className="hidden md:block sticky top-20 h-[calc(100vh-6rem)] overflow-auto pr-4">
      <div className="space-y-6">
        <div>
          <Label htmlFor="search" className="text-sm">Recherche</Label>
          <Input
            id="search"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Titre, description, lieu..."
            className="mt-2"
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Types</p>
          <div className="space-y-2">
            {(
              [
                ["activity", "Activité"],
                ["announcement", "Annonce"],
                ["promotion", "Promotion"],
                ["menu_update", "Nouveau menu"],
                ["opening_hours", "Horaires"],
                ["special_event", "Événement spécial"],
              ] as [PostTypeKey, string][]
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={filters.postTypes[key]}
                  onCheckedChange={() => toggleType(key)}
                  id={`type-${key}`}
                />
                <span>{label}</span>
                {counts?.[key] != null && (
                  <Badge variant="secondary" className="ml-auto">{counts[key]}</Badge>
                )}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Catégorie</p>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filters.category === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilters((prev) => ({ ...prev, category: "all" }))}
            >
              Toutes
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={filters.category === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilters((prev) => ({ ...prev, category: cat }))}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Options</p>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.onlyUpcoming}
                onCheckedChange={() => setFilters((prev) => ({ ...prev, onlyUpcoming: !prev.onlyUpcoming }))}
              />
              À venir uniquement
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.requiresReservation}
                onCheckedChange={() => setFilters((prev) => ({ ...prev, requiresReservation: !prev.requiresReservation }))}
              />
              Réservation requise
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.freeOnly}
                onCheckedChange={() => setFilters((prev) => ({ ...prev, freeOnly: !prev.freeOnly }))}
              />
              Gratuit uniquement
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
