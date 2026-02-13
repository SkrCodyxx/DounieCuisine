export interface CateringVariantDisplay {
  id: number;
  label: string;
  price: number;
  isDefault: boolean;
  order: number;
}

interface RawCateringPrice {
  id: number;
  size_label_fr?: string;
  size_label_en?: string;
  sizeLabelFr?: string;
  sizeLabelEn?: string;
  price: number;
  is_default?: number;
  isDefault?: number;
  display_order?: number;
  displayOrder?: number;
}

export function mapCateringPrices(
  prices: RawCateringPrice[] | undefined | null
): CateringVariantDisplay[] {
  if (!Array.isArray(prices)) return [];
  return prices
    .filter((p) => typeof p.price === "number")
    .sort(
      (a, b) =>
        ((a.display_order ?? a.displayOrder ?? 0) - (b.display_order ?? b.displayOrder ?? 0)) ||
        a.id - b.id
    )
    .map((p) => ({
      id: p.id,
      label: p.size_label_fr ?? p.sizeLabelFr ?? p.size_label_en ?? p.sizeLabelEn ?? "Option",
      price: p.price,
      isDefault: (p.is_default ?? p.isDefault ?? 0) === 1,
      order: p.display_order ?? p.displayOrder ?? 0,
    }));
}

export function formatPriceCAD(value: number): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(value);
}

export function getUnifiedPriceDisplay(prices: RawCateringPrice[] | undefined | null): string {
  const variants = mapCateringPrices(prices).filter((v) => v.price > 0);
  if (variants.length === 0) return "Sur demande";
  if (variants.length === 1) return formatPriceCAD(variants[0].price);
  const min = Math.min(...variants.map((v) => v.price));
  const max = Math.max(...variants.map((v) => v.price));
  if (min === max) return formatPriceCAD(min);
  return `${formatPriceCAD(min)} - ${formatPriceCAD(max)}`;
}
