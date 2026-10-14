import { dbConnect } from "@/lib/db/connect";
import { Order, IOrder } from "@/lib/db/models/Order";
import { Service } from "@/lib/db/models/Service";
import { supplierClient } from "./index";
import { INCLUDED_AUTO_POSTS } from "@/lib/catalog";

/** "https://instagram.com/name/", "@name" or "name" -> "name" */
export function usernameFromLink(link: string) {
  const trimmed = link.trim();
  try {
    const segment = new URL(trimmed).pathname.split("/").find(Boolean);
    if (segment) return segment.replace(/^@/, "");
  } catch {
    // not a URL; treat as a handle
  }
  return trimmed.replace(/^@/, "");
}

export interface FulfillmentDispatchResult {
  success: boolean;
  mode: "automated" | "manual";
  supplierOrderId?: string;
  status: string;
  error?: string;
}

/**
 * Dispatches an order to the supplier (Peakerr or Mock) if a supplierServiceId
 * is mapped. If unmapped, gracefully marks the order for manual fulfillment.
 */
export async function fulfillOrder(
  orderIdOrDoc: string | (IOrder & { save: () => Promise<unknown> }),
  options?: { manualSupplierServiceId?: string }
): Promise<FulfillmentDispatchResult> {
  await dbConnect();

  const order =
    typeof orderIdOrDoc === "string"
      ? await Order.findById(orderIdOrDoc)
      : orderIdOrDoc;

  if (!order) {
    return {
      success: false,
      mode: "manual",
      status: "failed",
      error: "Order not found",
    };
  }

  if (order.paymentSource === "bank" && !order.paymentConfirmedAt) {
    return { success: false, mode: "manual", status: "pending", error: "Confirm the bank payment before dispatching this order" };
  }

  const service = await Service.findById(order.serviceId);
  const supplierServiceId =
    options?.manualSupplierServiceId?.trim() ||
    service?.supplierServiceId?.trim() ||
    null;

  // Case 1: No Peakerr service ID is mapped -> Queue for manual fulfillment
  if (!supplierServiceId || (!process.env.PEAKERR_API_KEY?.trim() && process.env.PEAKERR_SANDBOX !== "true")) {
    order.supplierOrderId = null;
    order.supplierStatus = "manual_fulfillment_required";
    order.status = "processing";
    order.failureReason = null;
    await order.save();

    return {
      success: true,
      mode: "manual",
      status: "processing",
    };
  }

  // Case 2: Peakerr service ID is mapped -> Automated dispatch
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, supplierOrderId: null, supplierStatus: { $ne: "dispatching" } },
    { $set: { supplierStatus: "dispatching" } }
  );
  if (!claimed) return { success: true, mode: "automated", status: order.status, supplierOrderId: order.supplierOrderId || undefined };
  try {
    const result = await supplierClient.submitOrder({
      supplierServiceId,
      link: order.targetLink,
      quantity: order.qtyValue,
      ...(order.serviceKind === "comments" && { comments: order.comments }),
      ...(order.serviceKind === "poll" && order.pollOption && { pollOption: order.pollOption }),
      ...(order.serviceKind === "auto" && {
        subscription: {
          username: usernameFromLink(order.targetLink),
          posts: order.postsCovered ?? INCLUDED_AUTO_POSTS,
        },
      }),
    });

    order.supplierOrderId = result.supplierOrderId;
    order.supplierStatus = result.status;
    order.status = "processing";
    order.failureReason = null;
    await order.save();

    return {
      success: true,
      mode: "automated",
      supplierOrderId: result.supplierOrderId,
      status: "processing",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Supplier dispatch failed";
    console.error(`[Supplier Fulfillment] Failed for order ${order._id}:`, message);

    order.supplierStatus = "submission_error";
    order.failureReason = message;
    // Keep as processing so admin can see failure reason and retry or resolve manually
    order.status = "processing";
    await order.save();

    return {
      success: false,
      mode: "automated",
      status: "processing",
      error: message,
    };
  }
}

