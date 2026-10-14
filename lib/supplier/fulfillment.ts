import { dbConnect } from "@/lib/db/connect";
import { Order, IOrder } from "@/lib/db/models/Order";
import { Service } from "@/lib/db/models/Service";
import { getProviderClient } from "./index";
import {
  providerConfig,
  resolveProviderMapping,
  type ProviderId,
} from "./providers";
import { ProviderRejectedError } from "./peakerrSupplierClient";
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
 * Uses the selected provider and package mapping; unconfigured orders queue for staff.
 */
export async function fulfillOrder(
  orderIdOrDoc: string | (IOrder & { save: () => Promise<unknown> }),
  options?: { manualSupplierServiceId?: string; provider?: ProviderId },
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

  if (order.supplierOrderId)
    return {
      success: true,
      mode: "automated",
      status: order.status,
      supplierOrderId: order.supplierOrderId,
    };
  if (["dispatching", "dispatch_unknown"].includes(order.supplierStatus || ""))
    return {
      success: false,
      mode: "manual",
      status: order.status,
      error:
        "Check the original provider submission and reconcile it before retrying",
    };
  if (
    ["completed", "cancelled", "failed"].includes(order.status) ||
    ((order.refundedCents || 0) >= order.priceCents &&
      order.paymentSource !== "bonus")
  )
    return {
      success: false,
      mode: "manual",
      status: order.status,
      error: "Terminal or fully refunded orders cannot be dispatched",
    };

  if (order.paymentSource !== "bonus" && !order.paymentConfirmedAt) {
    return {
      success: false,
      mode: "manual",
      status: "pending",
      error: "Confirm payment before dispatching this order",
    };
  }

  const service = await Service.findById(order.serviceId);
  let mapping;
  try {
    mapping = resolveProviderMapping(
      service || { platformId: order.platformId },
      order.qtyValue,
      options?.provider,
      options?.manualSupplierServiceId,
    );
  } catch (error) {
    return {
      success: false,
      mode: "manual",
      status: order.status,
      error: error instanceof Error ? error.message : "Invalid provider",
    };
  }
  const { provider, serviceId: supplierServiceId } = mapping;

  // Missing credentials or mappings cannot silently simulate paid delivery.
  if (!supplierServiceId || !providerConfig(provider).configured) {
    const queued = await Order.findOneAndUpdate(
      {
        _id: order._id,
        supplierOrderId: null,
        supplierStatus: { $nin: ["dispatching", "dispatch_unknown"] },
        status: { $nin: ["completed", "cancelled", "failed"] },
      },
      {
        $set: {
          supplierStatus: "manual_fulfillment_required",
          status: "processing",
          failureReason: null,
          supplierProvider: provider,
        },
      },
    );
    if (!queued)
      return {
        success: false,
        mode: "manual",
        status: order.status,
        error: "Order changed; refresh before dispatching",
      };
    order.supplierStatus = "manual_fulfillment_required";
    order.status = "processing";
    order.failureReason = null;
    order.supplierProvider = provider;

    return {
      success: true,
      mode: "manual",
      status: "processing",
    };
  }

  // Reserve submission before making an external call.
  const claimed = await Order.findOneAndUpdate(
    {
      _id: order._id,
      supplierOrderId: null,
      supplierStatus: { $nin: ["dispatching", "dispatch_unknown"] },
      status: { $nin: ["completed", "cancelled", "failed"] },
    },
    {
      $set: {
        supplierStatus: "dispatching",
        supplierProvider: provider,
        supplierServiceIdUsed: supplierServiceId,
      },
    },
  );
  if (!claimed)
    return {
      success: false,
      mode: "manual",
      status: order.status,
      error:
        "Dispatch is already in progress or needs reconciliation. Do not resend until the provider order is checked.",
    };
  order.supplierProvider = provider;
  order.supplierServiceIdUsed = supplierServiceId;
  try {
    const result = await getProviderClient(provider).submitOrder({
      supplierServiceId,
      link: order.targetLink,
      quantity: order.qtyValue,
      ...(order.serviceKind === "comments" && { comments: order.comments }),
      ...(order.serviceKind === "poll" &&
        order.pollOption && { pollOption: order.pollOption }),
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
    const message =
      error instanceof Error ? error.message : "Supplier dispatch failed";
    console.error(
      `[Supplier Fulfillment] Failed for order ${order._id}:`,
      message,
    );

    const rejected = error instanceof ProviderRejectedError;
    order.supplierStatus = rejected ? "submission_error" : "dispatch_unknown";
    order.failureReason = message;
    // Keep as processing so admin can see failure reason and retry or resolve manually
    order.status = "processing";
    await order.save();

    return {
      success: false,
      mode: rejected ? "automated" : "manual",
      status: "processing",
      error: message,
    };
  }
}
