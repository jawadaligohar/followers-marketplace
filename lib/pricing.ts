export const WALLET_DISCOUNT = 0.05;

// Seed data for prices lives in lib/catalog.ts (GBP, converted to USD). The source
// of truth at runtime is the Service collection in MongoDB (lib/db/models/Service.ts).

export function centsToUsd(cents: number) {
  return (cents / 100).toFixed(2);
}

export function walletPriceCents(priceCents: number) {
  return Math.round(priceCents * (1 - WALLET_DISCOUNT));
}
