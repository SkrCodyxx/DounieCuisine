// Unified variant mapping for catering items to approximate DishVariant logic
// This allows reuse of variant display components / consistent pricing UI.
// Catering prices come as: { id, size_label_fr, size_label_en, price, is_default, display_order }
// Takeout DishVariant expects: { id, dishId, size: 'small'|'large', price: string, isDefault, createdAt, updatedAt }
// For catering we will produce a generic Variant type with label + price.

export interface CateringVariantDisplay {
  id: number;
  label: string; // French label used primarily
  price: number; // numeric price
  isDefault: boolean;
  order: number;
}

export function mapCateringPrices(prices: any[] | undefined | null): CateringVariantDisplay[] {
  if (!Array.isArray(prices)) return [];
  return prices
    .filter(p => typeof p.price === 'number')
    .sort((a,b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id)
    .map(p => ({
      id: p.id,
      label: p.size_label_fr || p.size_label_en || 'Option',
      price: p.price,
      isDefault: p.is_default === 1,
      order: p.display_order ?? 0,
    }));
}

export function formatPriceCAD(value: number): string {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);
}

export function getUnifiedPriceDisplay(prices: any[] | undefined | null): string {
  const variants = mapCateringPrices(prices).filter(v => v.price > 0);
  if (variants.length === 0) return 'Sur demande';
  if (variants.length === 1) return formatPriceCAD(variants[0].price);
  const min = Math.min(...variants.map(v => v.price));
  const max = Math.max(...variants.map(v => v.price));
  if (min === max) return formatPriceCAD(min);
  return `${formatPriceCAD(min)} - ${formatPriceCAD(max)}`;
}

// Helper to get an ordered variant list with display-ready price string
export function getVariantDisplayList(prices: any[] | undefined | null): { id:number; label:string; priceDisplay:string }[] {
  return mapCateringPrices(prices).filter(v=>v.price>0).map(v=>({
    id: v.id,
    label: v.label,
    priceDisplay: formatPriceCAD(v.price)
  }));
}
