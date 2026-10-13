import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { nowpayments } from "@/lib/nowpayments";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { Service } from "@/lib/db/models/Service";
import { Transaction } from "@/lib/db/models/Transaction";
import { supplierClient } from "@/lib/supplier";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const sig = reqHeaders.get("x-nowpayments-sig");

    if (!sig || !nowpayments.verifySignature(body, sig)) {
      console.error("NOWPayments Webhook: Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { payment_id, invoice_id, payment_status, order_id } = body;

    if (payment_status !== "finished" && payment_status !== "confirmed") {
      return NextResponse.json({ received: true, status: payment_status });
    }

    if (typeof order_id !== "string" || !order_id.startsWith("cart_")) {
      return NextResponse.json({ received: true, note: "Ignored, not a cart" });
    }

    await dbConnect();

    const orders = await Order.find({ cryptoCheckoutId: order_id, status: "pending" });
    if (orders.length === 0) {
      return NextResponse.json({ received: true, note: "Orders already processed or not found" });
    }

    // Ledger entry for auditing/idempotency tracking if order has an authenticated user
    const firstOrder = orders[0];
    if (firstOrder.userId) {
      await Transaction.create({
        userId: firstOrder.userId,
        type: "order_debit",
        amountCents: 0,
        balanceAfterCents: 0,
        relatedOrderId: firstOrder._id,
        nowpaymentsInvoiceId: invoice_id ? String(invoice_id) : null,
        nowpaymentsPaymentId: payment_id ? String(payment_id) : null,
        note: `Cart crypto payment confirmed via NOWPayments (${orders.length} items)`,
      });
    }

    for (const order of orders) {
      const service = await Service.findById(order.serviceId);

      try {
        const result = await supplierClient.submitOrder({
          supplierServiceId: service?.supplierServiceId ?? "mock",
          link: order.targetLink,
          quantity: order.qtyValue,
        });
        order.supplierOrderId = result.supplierOrderId;
        order.supplierStatus = result.status;
        order.status = "processing";
      } catch (err: unknown) {
        console.error("Failed to submit order to supplier:", err);
        order.status = "failed";
        order.failureReason = "Supplier submission failed after crypto payment";
      }
      await order.save();
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("NOWPayments cart webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
