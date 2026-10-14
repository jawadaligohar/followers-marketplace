import { Order } from "@/lib/db/models/Order";
import { dbConnect } from "@/lib/db/connect";
import { safePostUrl } from "@/lib/socialPreview";
import { getProviderClient } from "./index";
import { randomUUID } from "node:crypto";

/** Staff verifies the missing delivery before requesting a merchant-funded
 * replacement. This records the obligation; it never sends a paid add request. */
export async function requestMerchantRefill(
  id: string,
  quantity: number,
  reason: string,
  targetLink?: string,
) {
  await dbConnect();
  const order = await Order.findById(id);
  if (
    !order ||
    (order.paymentSource !== "bonus" && !order.paymentConfirmedAt) ||
    !(
      order.status === "completed" ||
      (order.serviceKind === "auto" && order.status === "processing")
    ) ||
    !order.supplierOrderId ||
    order.refundedCents ||
    Date.now() - order.createdAt.getTime() > 30 * 86400000
  )
    throw new Error(
      "Only delivered, non-refunded orders within 30 days qualify for replacement",
    );
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > order.qtyValue)
    throw new Error(
      "Verified missing quantity must be between 1 and the original per-post quantity",
    );
  if (!reason?.trim() || reason.trim().length > 1000)
    throw new Error("Record how the missing delivery was verified");
  const link = targetLink?.trim() || order.targetLink;
  if (order.serviceKind === "auto") {
    const url = new URL(link);
    if (
      (order.platformId === "instagram" &&
        !/^\/(p|reel|tv)\//.test(url.pathname)) ||
      (order.platformId === "tiktok" &&
        !/^\/@[^/]+\/video\/\d+/.test(url.pathname))
    )
      throw new Error("Auto-plan replacements need a specific public post URL");
  }
  if (
    !safePostUrl(link, order.platformId) &&
    !["facebook"].includes(order.platformId)
  )
    throw new Error("Use a public URL on the original platform");
  if (order.platformId === "facebook") {
    const url = new URL(link);
    if (
      url.protocol !== "https:" ||
      !["facebook.com", "www.facebook.com"].includes(url.hostname) ||
      url.username ||
      url.password
    )
      throw new Error("Use a public Facebook URL");
  }
  if (order.serviceKind !== "auto" && link !== order.targetLink)
    throw new Error("Replacement must target the original order URL");
  const previous = order.merchantRefill;
  if (previous?.status === "requested")
    throw new Error("A replacement is already pending");
  const history = [
    ...(order.merchantRefillHistory || []),
    ...(previous ? [previous] : []),
  ];
  const replaced = history
    .filter((item) => item.targetLink === link)
    .reduce((sum, item) => sum + item.quantity, 0);
  if (quantity + replaced > order.qtyValue)
    throw new Error(
      "Cumulative replacement quantity exceeds the original per-post quantity",
    );
  const updated = await Order.findOneAndUpdate(
    {
      _id: id,
      ...(previous
        ? {
            "merchantRefill.status": "completed",
            "merchantRefill.requestId": previous.requestId,
          }
        : { merchantRefill: null }),
      supplierRefillId: null,
      supplierActionPending: null,
      refundedCents: 0,
      status: order.status,
    },
    {
      ...(previous
        ? { $push: { merchantRefillHistory: previous.toObject() } }
        : {}),
      $set: {
        merchantRefill: {
          requestId: randomUUID(),
          status: "requested",
          quantity,
          reason: reason.trim(),
          targetLink: link,
          provider: order.supplierProvider || "peakerr",
          requestedAt: new Date(),
        },
      },
    },
    { returnDocument: "after" },
  );
  if (!updated)
    throw new Error(
      "A refill already exists, another action is pending, or the order changed",
    );
  return updated;
}

export async function completeMerchantRefill(
  id: string,
  externalOrderId: string,
) {
  await dbConnect();
  const order = await Order.findById(id);
  if (!order?.merchantRefill || order.merchantRefill.status !== "requested")
    throw new Error("No outstanding merchant replacement");
  if (
    !/^[\w-]{1,100}$/.test(externalOrderId) ||
    externalOrderId === order.supplierOrderId ||
    order.merchantRefillHistory?.some(
      (item: { externalOrderId?: string }) =>
        item.externalOrderId === externalOrderId,
    )
  )
    throw new Error("Enter the separate replacement order ID");
  const result = await getProviderClient(
    order.merchantRefill.provider,
  ).getOrderStatus(externalOrderId);
  if (!["complete", "completed"].includes(result.status))
    throw new Error("Replacement provider order has not completed yet");
  const updated = await Order.findOneAndUpdate(
    {
      _id: id,
      "merchantRefill.status": "requested",
      "merchantRefill.requestId": order.merchantRefill.requestId,
      status: {
        $in:
          order.serviceKind === "auto"
            ? ["completed", "processing"]
            : ["completed"],
      },
      refundedCents: 0,
    },
    {
      $set: {
        "merchantRefill.status": "completed",
        "merchantRefill.externalOrderId": externalOrderId,
        "merchantRefill.completedAt": new Date(),
      },
    },
    { returnDocument: "after" },
  );
  if (!updated)
    throw new Error("Order changed; refresh before closing the replacement");
  return updated;
}
