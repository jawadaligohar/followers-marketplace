export type PricingTier = {
  qty: string;
  qtyValue: number;
  price: number;
  highlight?: boolean;
};

export const WALLET_DISCOUNT = 0.15;

// Seed data only -- source of truth for pricing at runtime is the Service collection
// in MongoDB (lib/db/models/Service.ts), populated by scripts/seed.ts from this data.
// Mirrors megafollowers.uk's real per-platform Followers pricing (GBP tiers converted to USD at ~1.27).
export const PLATFORM_PRICING: Record<string, PricingTier[]> = {
  instagram: [
    { qty: "100", qtyValue: 100, price: 2.49 },
    { qty: "250", qtyValue: 250, price: 5.89 },
    { qty: "500", qtyValue: 500, price: 11.39 },
    { qty: "1,000", qtyValue: 1000, price: 13.19, highlight: true },
    { qty: "2,500", qtyValue: 2500, price: 30.19 },
    { qty: "5,000", qtyValue: 5000, price: 46.59 },
    { qty: "10,000", qtyValue: 10000, price: 105.79 },
  ],
  tiktok: [
    { qty: "100", qtyValue: 100, price: 2.49 },
    { qty: "250", qtyValue: 250, price: 5.01 },
    { qty: "500", qtyValue: 500, price: 8.81 },
    { qty: "1,000", qtyValue: 1000, price: 14.49, highlight: true },
    { qty: "2,000", qtyValue: 2000, price: 25.19 },
    { qty: "5,000", qtyValue: 5000, price: 56.69 },
    { qty: "10,000", qtyValue: 10000, price: 100.79 },
  ],
  facebook: [
    { qty: "250", qtyValue: 250, price: 5.01 },
    { qty: "500", qtyValue: 500, price: 7.43 },
    { qty: "1,000", qtyValue: 1000, price: 14.49 },
    { qty: "2,500", qtyValue: 2500, price: 22.66, highlight: true },
    { qty: "5,000", qtyValue: 5000, price: 42.79 },
    { qty: "10,000", qtyValue: 10000, price: 80.59 },
  ],
};

export function walletPrice(price: number) {
  return price * (1 - WALLET_DISCOUNT);
}

export function formatUsd(value: number) {
  return value.toFixed(2);
}

export function centsToUsd(cents: number) {
  return (cents / 100).toFixed(2);
}

export function walletPriceCents(priceCents: number) {
  return Math.round(priceCents * (1 - WALLET_DISCOUNT));
}
