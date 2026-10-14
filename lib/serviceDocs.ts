import {
  CATALOG,
  INCLUDED_AUTO_POSTS,
  PLATFORMS,
  formatQty,
  gbpToUsdCents,
  type CatalogService,
  type LinkTarget,
  type PlatformId,
  type ServiceKind,
} from "@/lib/catalog";

// Client-safe shape of a Service document, as returned by /api/services.

export type PostsOptionDoc = { posts: number; priceCents: number };

export type TierDoc = {
  qty: string;
  qtyValue: number;
  priceCents: number;
  highlight?: boolean;
  postsOptions?: PostsOptionDoc[];
};

export type ServiceDoc = {
  _id: string;
  slug: string;
  kind: ServiceKind;
  target: LinkTarget;
  platformId: PlatformId;
  platformLabel: string;
  category: string;
  tiers: TierDoc[];
};

export function catalogTiers(svc: CatalogService): TierDoc[] {
  return svc.tiers.map((t) => ({
    qty: formatQty(t.qty),
    qtyValue: t.qty,
    priceCents: gbpToUsdCents(t.gbp),
    highlight: t.highlight ?? false,
    ...(svc.kind === "auto" && {
      postsOptions: [
        { posts: INCLUDED_AUTO_POSTS, priceCents: 0 },
        ...Object.entries(t.posts ?? {}).map(([posts, gbp]) => ({
          posts: Number(posts),
          // Convert the whole plan once, then derive its USD surcharge.
          priceCents: gbpToUsdCents(t.gbp + gbp) - gbpToUsdCents(t.gbp),
        })),
      ],
    }),
  }));
}

/** Catalog rendered as ServiceDocs without database ids, for first paint before /api/services loads. */
export function catalogServiceDocs(): ServiceDoc[] {
  return CATALOG.map((svc) => ({
    _id: "",
    slug: svc.slug,
    kind: svc.kind,
    target: svc.target,
    platformId: svc.platformId,
    platformLabel: PLATFORMS[svc.platformId].label,
    category: svc.category,
    tiers: catalogTiers(svc),
  }));
}

export function defaultTier(svc: ServiceDoc) {
  return svc.tiers.find((t) => t.highlight) ?? svc.tiers[0];
}

/** Display price for a tier including any auto-plan posts surcharge. The server re-derives this. */
export function linePriceCents(tier: TierDoc, postsCovered?: number | null) {
  const extra = postsCovered ? tier.postsOptions?.find((o) => o.posts === postsCovered)?.priceCents ?? 0 : 0;
  return tier.priceCents + extra;
}

/** Client-side check mirroring lib/orderLine.ts, so problems surface before checkout. */
export function lineExtrasError(
  kind: ServiceKind,
  qtyValue: number,
  extras: { comments?: string[]; pollOption?: number | null }
): string | null {
  if (kind === "comments") {
    const n = (extras.comments ?? []).filter((c) => c.trim()).length;
    if (n !== qtyValue) return `Enter exactly ${qtyValue} comments (you have ${n})`;
  }
  if (kind === "poll" && !extras.pollOption) return "Choose which poll option should receive the votes";
  return null;
}

export function unitSuffix(kind: ServiceKind) {
  return kind === "auto" ? " per post" : "";
}
