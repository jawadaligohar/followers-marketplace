import { Order } from "@/lib/db/models/Order";
import { getProviderClient } from "@/lib/supplier";
import type { ProviderId } from "./providers";
import { dbConnect } from "@/lib/db/connect";
import { ProviderRejectedError } from "./peakerrSupplierClient";

async function claimAction(
  orderId: string,
  action: "cancel" | "refill",
  run: () => Promise<unknown>,
) {
  const claimed = await Order.findOneAndUpdate(
    {
      _id: orderId,
      supplierActionPending: null,
      ...(action === "refill"
        ? { supplierRefillId: null }
        : { supplierStatus: { $ne: "cancel_requested" } }),
    },
    { $set: { supplierActionPending: action } },
  );
  if (!claimed)
    throw new Error(
      "A provider action is already pending or requires manual reconciliation",
    );
  try {
    return await run();
  } catch (error) {
    if (error instanceof ProviderRejectedError)
      await Order.updateOne(
        { _id: orderId },
        { $set: { supplierActionPending: null } },
      );
    throw error;
  }
}

export async function supplierOrderAction(
  id: string,
  action: "sync" | "cancel" | "refill" | "refillStatus" | "reconcile",
  reconciliation?: { provider: ProviderId; supplierOrderId: string },
) {
  await dbConnect();
  const order = await Order.findById(id);
  if (!order) throw new Error("Order not found");
  if (action === "reconcile") {
    if (
      !reconciliation ||
      order.supplierOrderId ||
      !["dispatch_unknown", "dispatching"].includes(order.supplierStatus)
    )
      throw new Error(
        "Only unresolved submissions can be linked to a verified provider order",
      );
    if (reconciliation.provider !== order.supplierProvider)
      throw new Error("Reconcile with the provider originally used");
    // Query before accepting a staff-entered external order ID.
    await getProviderClient(reconciliation.provider).getOrderStatus(
      reconciliation.supplierOrderId,
    );
    order.supplierOrderId = reconciliation.supplierOrderId;
    order.supplierStatus = "reconciled";
    order.failureReason = null;
    await order.save();
    return order;
  }
  if (!order.supplierOrderId)
    throw new Error("This order has not been submitted to a provider");
  const client = getProviderClient(order.supplierProvider || "peakerr");
  if (action === "sync") {
    const result = await client.getOrderStatus(order.supplierOrderId);
    order.supplierStatus = result.status;
    order.supplierLastCheckedAt = new Date();
    // Provider completion cannot undo a locally recorded refund or cancellation.
    if (order.status !== "cancelled" && order.status !== "failed") {
      if (["completed", "complete"].includes(result.status))
        order.status = "completed";
      else if (["canceled", "cancelled"].includes(result.status))
        order.status = "cancelled";
      else if (result.status === "failed") order.status = "failed";
    }
  } else if (action === "cancel") {
    if (["completed", "cancelled", "failed"].includes(order.status))
      throw new Error("This order is already terminal");
    if (order.supplierStatus === "cancel_requested")
      throw new Error(
        "Cancellation is already requested; refresh provider status",
      );
    await claimAction(id, "cancel", () =>
      client.requestAction("cancel", order.supplierOrderId),
    );
    order.supplierStatus = "cancel_requested";
    order.supplierActionPending = null;
  } else if (action === "refill") {
    if (order.supplierRefillId)
      throw new Error("A refill already exists; check its status");
    if (
      order.status !== "completed" ||
      order.refundedCents ||
      Date.now() - order.createdAt.getTime() > 30 * 86400000
    )
      throw new Error(
        "Only completed, non-refunded orders within 30 days qualify for a refill request",
      );
    const result = (await claimAction(id, "refill", () =>
      client.requestAction("refill", order.supplierOrderId),
    )) as { refill?: string | number };
    if (!result.refill) throw new Error("Provider did not return a refill ID");
    order.supplierRefillId = String(result.refill);
    order.supplierActionPending = null;
  } else {
    if (!order.supplierRefillId) throw new Error("No refill exists");
    return {
      order,
      refillStatus: await client.requestAction(
        "refill_status",
        order.supplierRefillId,
      ),
    };
  }
  await order.save();
  return order;
}
