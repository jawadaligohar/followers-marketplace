import { gbpToUsdCents } from "@/lib/catalog";

export const BONUS_LIKES = 50;
export const LOYALTY_RATE = 0.01;
export const DRAW_ENTRY_CENTS = gbpToUsdCents(100);
export function loyaltyCreditCents(netSpendCents: number) {
  return Math.floor(Math.max(0, netSpendCents) * LOYALTY_RATE);
}
export function drawEntries(qualifyingCents: number) {
  return Math.floor(Math.max(0, qualifyingCents) / DRAW_ENTRY_CENTS);
}
export function monthBounds(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month");
  const from = new Date(`${month}-01T00:00:00Z`);
  const to = new Date(from);
  to.setUTCMonth(to.getUTCMonth() + 1);
  return { from, to };
}
