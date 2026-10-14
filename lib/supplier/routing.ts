import type { ProviderId } from "./providers";

/** Reviewed against the providers' service pages on 2026-10-14.
 * These are routing choices, not evidence of delivery quality. Never fail over
 * after a submission: reconcile the original provider order first.
 */
export interface SupplierRoute {
  provider: ProviderId;
  id?: string;
  min?: number;
  max?: number;
  rate?: number;
  kind?: "standard" | "comments" | "auto" | "poll";
  hold?: string;
  durationMinutes?: number;
  pollInLink?: boolean;
  /** Our support team replaces verified drops when the supplier has no refill. */
  merchantRefill?: boolean;
}

export const SUPPLIER_ROUTES: Record<string, SupplierRoute> = {
  "instagram-followers": {
    provider: "peakerr",
    id: "32867",
    min: 1,
    max: 1000000,
    rate: 2.183,
  },
  "instagram-likes": {
    provider: "peakerr",
    id: "31241",
    min: 1,
    max: 1000000,
    rate: 0.0402,
  },
  "instagram-uk-followers": {
    provider: "jap",
    id: "7864",
    min: 10,
    max: 100000,
    rate: 4.75,
  },
  "instagram-views": {
    provider: "peakerr",
    id: "22136",
    min: 100,
    max: 1000000000,
    rate: 0.001,
  },
  "instagram-comments": {
    provider: "peakerr",
    id: "26590",
    min: 10,
    max: 10000,
    rate: 4.13,
    kind: "comments",
  },
  "instagram-auto-likes": {
    provider: "peakerr",
    id: "34466",
    min: 50,
    max: 200000,
    rate: 0.0952,
    kind: "auto",
  },
  "instagram-auto-views": {
    provider: "peakerr",
    id: "36189",
    min: 100,
    max: 100000000,
    rate: 0.0012,
    kind: "auto",
  },
  "instagram-female-followers": {
    provider: "peakerr",
    id: "16329",
    min: 10,
    max: 100000,
    rate: 4.1688,
  },
  "instagram-reel-views": {
    provider: "peakerr",
    id: "22136",
    min: 100,
    max: 1000000000,
    rate: 0.001,
  },
  "instagram-uk-likes": {
    provider: "jap",
    id: "1037",
    min: 20,
    max: 2000,
    rate: 4.125,
    merchantRefill: true,
  },
  "instagram-uk-auto-likes": {
    provider: "jap",
    id: "1771",
    min: 20,
    max: 2000,
    rate: 4.125,
    kind: "auto",
    merchantRefill: true,
  },
  "tiktok-followers": {
    provider: "tiksta",
    id: "3",
    min: 10,
    max: 750000,
    rate: 4.39,
  },
  "tiktok-likes": {
    provider: "tiksta",
    id: "14",
    min: 50,
    max: 100000,
    rate: 3.95,
  },
  "tiktok-views": {
    provider: "tiksta",
    id: "47",
    min: 100,
    max: 100000000,
    rate: 0.06,
  },
  "tiktok-comments": {
    provider: "tiksta",
    id: "90",
    min: 10,
    max: 50000,
    rate: 6.25,
    kind: "comments",
    merchantRefill: true,
  },
  "tiktok-live-stream-views": {
    provider: "tiksta",
    id: "65",
    min: 50,
    max: 50000,
    rate: 1.32,
    durationMinutes: 30,
  },
  "tiktok-uk-views": {
    provider: "tiksta",
    id: "166",
    min: 100,
    max: 5000000,
    rate: 0.01,
    merchantRefill: true,
  },
  "tiktok-uk-likes": {
    provider: "peakerr",
    id: "32791",
    min: 10,
    max: 100000,
    rate: 1.4868,
  },
  "tiktok-auto-likes": {
    provider: "jap",
    id: "10264",
    min: 10,
    max: 1000000,
    rate: 0.27,
    kind: "auto",
    merchantRefill: true,
  },
  "tiktok-auto-views": {
    provider: "jap",
    id: "10265",
    min: 100,
    max: 30000000,
    rate: 0.055,
    kind: "auto",
  },
  "facebook-followers": {
    provider: "peakerr",
    id: "32122",
    min: 50,
    max: 100000,
    rate: 0.2136,
  },
  "facebook-page-likes": {
    provider: "peakerr",
    id: "34353",
    min: 10,
    max: 500000,
    rate: 0.3399,
  },
  "facebook-post-likes": {
    provider: "peakerr",
    id: "29578",
    min: 10,
    max: 1000000,
    rate: 0.3894,
  },
  "facebook-video-views": {
    provider: "peakerr",
    id: "32194",
    min: 1,
    max: 1000000000,
    rate: 0.0228,
  },
  "facebook-uk-page-likes": {
    provider: "jap",
    id: "6649",
    min: 10,
    max: 1500,
    rate: 12.922,
  },
  "facebook-uk-post-likes": {
    provider: "jap",
    id: "6618",
    min: 10,
    max: 500,
    rate: 12.922,
  },
  "facebook-uk-followers": {
    provider: "jap",
    id: "6657",
    min: 10,
    max: 2000,
    rate: 12.922,
  },
  "twitter-followers": {
    provider: "peakerr",
    id: "33608",
    min: 50,
    max: 100000,
    rate: 6.2304,
  },
  "twitter-likes": {
    provider: "peakerr",
    id: "33696",
    min: 10,
    max: 20000,
    rate: 3.0586,
  },
  "twitter-retweets": {
    provider: "jap",
    id: "8861",
    min: 10,
    max: 15000,
    rate: 0.5,
  },
  "twitter-views": {
    provider: "peakerr",
    id: "31492",
    min: 100,
    max: 100000000,
    rate: 0.0048,
  },
  "twitter-votes": {
    provider: "jap",
    id: "9015",
    min: 100,
    max: 20000,
    rate: 0.1,
    kind: "poll",
    pollInLink: true,
  },
  "twitter-female-followers": {
    provider: "jap",
    id: "1879",
    min: 100,
    max: 100000,
    rate: 10.625,
    merchantRefill: true,
  },
  "twitter-space-listeners": {
    provider: "jap",
    id: "2251",
    min: 50,
    max: 10001,
    rate: 0.2921,
    durationMinutes: 30,
  },
};

export function dispatchEnabled() {
  return process.env.SMM_DISPATCH_ENABLED === "true";
}

export function routeHold(
  route: SupplierRoute,
  quantity: number,
  posts = 30,
  priceCents?: number,
) {
  if (route.hold) return route.hold;
  if (!route.id) return "No compatible supplier listing";
  if (quantity < (route.min ?? 1) || quantity > (route.max ?? Infinity))
    return "Quantity is outside the reviewed supplier limits";
  // Quoted dollar rates are provisional until the API confirms currency/rate.
  const cost =
    (((route.rate ?? 0) * quantity) / 1000) *
    (route.kind === "auto" ? posts : 1) *
    100;
  if (priceCents !== undefined && priceCents > 0 && cost >= priceCents)
    return "Estimated supplier cost meets or exceeds the order's paid amount";
  return null;
}

export function supplierLink(
  link: string,
  pollOption?: number,
  route?: SupplierRoute,
) {
  if (!route?.pollInLink) return link;
  if (!Number.isInteger(pollOption) || pollOption! < 1 || pollOption! > 4)
    throw new Error("Select poll option 1–4 before dispatch");
  const url = new URL(link);
  url.searchParams.set("vote", String(pollOption));
  return url.toString();
}
