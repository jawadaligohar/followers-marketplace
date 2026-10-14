"use client";

import { useState } from "react";
import { INCLUDED_AUTO_POSTS } from "@/lib/catalog";
import { serviceAvailability } from "@/lib/serviceAvailability";
import type { CartItem } from "@/lib/cart/CartContext";
import {
  defaultTier,
  lineExtrasError,
  linePriceCents,
  unitSuffix,
  type ServiceDoc,
} from "@/lib/serviceDocs";

/**
 * In-progress order line for one service. Selections are kept across service
 * switches and re-validated against the current service, so switching from
 * "Likes" to "Views" keeps the link the customer already typed.
 */
export function useLineDraft(service: ServiceDoc | undefined, initialQty?: number) {
  const [qtyValue, setQtyValue] = useState<number | undefined>(initialQty);
  const [postsCovered, setPostsCovered] = useState(INCLUDED_AUTO_POSTS);
  const [targetLink, setTargetLink] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [pollOption, setPollOption] = useState<number | undefined>();

  const tier = service ? service.tiers.find((t) => t.qtyValue === qtyValue) ?? defaultTier({ ...service, tiers: service.tiers.filter(t => !serviceAvailability(service.slug, t.qtyValue)) }) ?? service.tiers[0] : undefined;
  const unavailable = service && tier ? serviceAvailability(service.slug, tier.qtyValue) : null;
  const isAuto = service?.kind === "auto";
  const posts =
    isAuto && tier?.postsOptions?.some((o) => o.posts === postsCovered) ? postsCovered : INCLUDED_AUTO_POSTS;
  const priceCents = tier ? linePriceCents(tier, isAuto ? posts : null) : 0;

  /** Returns an error message, or null when the line is ready for the cart. */
  function validate(requireLink: boolean): string | null {
    if (!service || !tier) return "Choose a service first";
    if (unavailable) return unavailable;
    if (!service._id) return "Services are still loading, try again in a moment";
    if (requireLink && !targetLink.trim()) return "Enter your link first";
    return lineExtrasError(service.kind, tier.qtyValue, { comments, pollOption });
  }

  function toCartItem(): Omit<CartItem, "id"> {
    if (!service || !tier) throw new Error("No service selected");
    return {
      serviceId: service._id,
      slug: service.slug,
      kind: service.kind,
      target: service.target,
      platformId: service.platformId,
      platformLabel: service.platformLabel,
      category: service.category,
      qty: `${tier.qty}${unitSuffix(service.kind)}`,
      qtyValue: tier.qtyValue,
      priceCents,
      targetLink: targetLink.trim(),
      ...(isAuto && { postsCovered: posts }),
      ...(service.kind === "comments" && { comments: comments.map((c) => c.trim()).filter(Boolean) }),
      ...(service.kind === "poll" && pollOption && { pollOption }),
    };
  }

  return {
    tier,
    unavailable,
    priceCents,
    postsCovered: posts,
    targetLink,
    comments,
    pollOption,
    setQtyValue,
    setPostsCovered,
    setTargetLink,
    setComments,
    setPollOption,
    validate,
    toCartItem,
  };
}

export type LineDraft = ReturnType<typeof useLineDraft>;
