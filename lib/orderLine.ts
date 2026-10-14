import { Service } from "@/lib/db/models/Service";
import type { IService, IServiceTier } from "@/lib/db/models/Service";
import type { CheckoutItemInput } from "@/lib/validation/checkout";
import type { PaymentSource } from "@/lib/db/models/Order";
import { INCLUDED_AUTO_POSTS, POLL_OPTIONS } from "@/lib/catalog";
import { walletPriceCents } from "@/lib/pricing";

export class LineItemError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export type ResolvedLine = {
  service: IService;
  tier: IServiceTier;
  name: string;
  fullPriceCents: number;
  chargeCents: number;
  /** Fields shared by every Order created from this line. */
  orderFields: {
    serviceId: IService["_id"];
    platformId: string;
    platformLabel: string;
    category: string;
    qtyValue: number;
    targetLink: string;
    serviceKind: IService["kind"];
    postsCovered: number | null;
    comments: string[];
    pollOption: number | null;
    priceCents: number;
  };
};

/**
 * Re-derives a cart line's price from the Service document and validates the
 * kind-specific extras. Client-sent prices are never trusted.
 */
export async function resolveLine(item: CheckoutItemInput, paymentSource: PaymentSource): Promise<ResolvedLine> {
  const service: IService | null = await Service.findById(item.serviceId);
  if (!service || !service.active) {
    throw new LineItemError("One of the services in your order is no longer available", 404);
  }

  const tier = service.tiers.find((t) => t.qtyValue === item.qtyValue);
  if (!tier) {
    throw new LineItemError("Invalid quantity for one of your order items", 400);
  }

  const title = `${service.platformLabel} ${service.category}`;
  let fullPriceCents = tier.priceCents;
  let postsCovered: number | null = null;
  let comments: string[] = [];
  let pollOption: number | null = null;
  let name = `${title} — ${tier.qty}`;

  switch (service.kind) {
    case "auto": {
      postsCovered = item.postsCovered ?? INCLUDED_AUTO_POSTS;
      if (postsCovered !== INCLUDED_AUTO_POSTS) {
        const option = tier.postsOptions?.find((o) => o.posts === postsCovered);
        if (!option) throw new LineItemError(`${title}: invalid posts limit`, 400);
        fullPriceCents += option.priceCents;
      }
      name = `${title} — ${tier.qty} per post, ${postsCovered} posts`;
      break;
    }
    case "comments": {
      comments = (item.comments ?? []).map((c) => c.trim()).filter(Boolean);
      if (comments.length !== tier.qtyValue) {
        throw new LineItemError(
          `${title}: enter exactly ${tier.qtyValue} comments (you have ${comments.length})`,
          400
        );
      }
      break;
    }
    case "poll": {
      pollOption = item.pollOption ?? null;
      if (!pollOption || !(POLL_OPTIONS as readonly number[]).includes(pollOption)) {
        throw new LineItemError(`${title}: choose which poll option should receive the votes`, 400);
      }
      name = `${title} — ${tier.qty} on option ${pollOption}`;
      break;
    }
  }

  const chargeCents = paymentSource === "wallet" ? walletPriceCents(fullPriceCents) : fullPriceCents;

  return {
    service,
    tier,
    name,
    fullPriceCents,
    chargeCents,
    orderFields: {
      serviceId: service._id,
      platformId: service.platformId,
      platformLabel: service.platformLabel,
      category: service.category,
      qtyValue: tier.qtyValue,
      targetLink: item.targetLink.trim(),
      serviceKind: service.kind,
      postsCovered,
      comments,
      pollOption,
      priceCents: chargeCents,
    },
  };
}
