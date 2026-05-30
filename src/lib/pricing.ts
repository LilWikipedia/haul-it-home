// Per-mile pricing model. Final price = base fee + (per-mile rate * miles), with a minimum.
// Sizes scale both the base fee and per-mile rate (bigger items = bigger vehicle = more $/mile).

export type SizeCategory = "small" | "medium" | "large" | "extra_large";
export type LatLng = { lat: number; lng: number };

export const PRICING = {
  small:       { base: 15, perMile: 1.75, min: 25 },
  medium:      { base: 25, perMile: 2.50, min: 45 },
  large:       { base: 40, perMile: 3.50, min: 75 },
  extra_large: { base: 60, perMile: 4.75, min: 120 },
} as const satisfies Record<SizeCategory, { base: number; perMile: number; min: number }>;

// Great-circle distance in miles between two coordinates.
export function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.7613; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type PriceBreakdown = {
  size: SizeCategory;
  miles: number | null;
  base: number;
  perMile: number;
  mileageCost: number;
  subtotal: number;
  total: number; // subtotal floored to min
  hasDistance: boolean;
};

export function estimatePrice(
  size: SizeCategory,
  pickup?: LatLng | null,
  dropoff?: LatLng | null,
): PriceBreakdown {
  const { base, perMile, min } = PRICING[size];
  const hasDistance = !!(pickup && dropoff);
  const miles = hasDistance ? haversineMiles(pickup!, dropoff!) : null;
  const mileageCost = miles != null ? miles * perMile : 0;
  const subtotal = base + mileageCost;
  const total = Math.max(subtotal, min);
  return {
    size,
    miles,
    base,
    perMile,
    mileageCost,
    subtotal,
    total: Math.round(total * 100) / 100,
    hasDistance,
  };
}
