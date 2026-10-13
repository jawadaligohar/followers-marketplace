import { dbConnect } from "@/lib/db/connect";
import { Order, IOrder } from "@/lib/db/models/Order";
import { Service } from "@/lib/db/models/Service";
import { supplierClient } from "./index";

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

  const service = await Service.findById(order.serviceId);
  const supplierServiceId =
    options?.manualSupplierServiceId?.trim() ||
    service?.supplierServiceId?.trim() ||
    null;

  // Case 1: No Peakerr service ID is mapped -> Queue for manual fulfillment
  if (!supplierServiceId) {
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
  try {
    const result = await supplierClient.submitOrder({
      supplierServiceId,
      link: order.targetLink,
      quantity: order.qtyValue,
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

