import type { PeakerrServiceInfo } from "./peakerrSupplierClient";
import type { SupplierRoute } from "./routing";

/** Validate the live API catalog before reserving or submitting a reviewed route. */
export function validateLiveListing(
  route: SupplierRoute,
  listing: PeakerrServiceInfo | undefined,
  currency: string,
  quantity: number,
  posts: number,
  paidCents: number,
) {
  if (!listing)
    return "Mapped service is missing from the live provider catalog";
  if (currency.toUpperCase() !== "USD")
    return "Provider account currency must be confirmed as USD";
  const type = listing.type?.toLowerCase().replace(/[^a-z]/g, "");
  const allowed =
    route.kind === "auto"
      ? ["subscriptions"]
      : route.kind === "comments"
        ? ["customcomments"]
        : ["default"];
  if (!type || !allowed.includes(type))
    return `Provider API type does not match the expected ${route.kind || "standard"} order`;
  const min = Number(listing.min),
    max = Number(listing.max),
    rate = Number(listing.rate);
  if (
    ![min, max, rate].every(Number.isFinite) ||
    min < 1 ||
    max < min ||
    rate < 0
  )
    return "Provider returned invalid limits or pricing";
  if (quantity < min || quantity > max)
    return "Quantity is outside the current provider API limits";
  const cost = Math.ceil(
    ((rate * quantity) / 1000) * (route.kind === "auto" ? posts : 1) * 100,
  );
  if (paidCents > 0 && cost >= paidCents)
    return "Current provider cost meets or exceeds the order's paid amount";
  return null;
}
