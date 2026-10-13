import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { nowpayments } from "@/lib/nowpayments";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { Transaction } from "@/lib/db/models/Transaction";
import { fulfillOrder } from "@/lib/supplier/fulfillment";
import mongoose from "mongoose";

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

    if (typeof order_id !== "string" || !order_id.startsWith("order_")) {
      return NextResponse.json({ received: true, note: "Ignored, not an order" });
    }

    const orderIdStr = order_id.split("_")[1];
    if (!orderIdStr || !mongoose.Types.ObjectId.isValid(orderIdStr)) {
      return NextResponse.json({ error: "Invalid orderId" }, { status: 400 });
    }

    await dbConnect();

    const order = await Order.findById(orderIdStr);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ received: true, note: "Order already processed" });
    }

    // Ledger entry for tracking & idempotency
    if (order.userId) {
      await Transaction.create({
        userId: order.userId,
        type: "order_debit",
        amountCents: 0,
        balanceAfterCents: 0,
        relatedOrderId: order._id,
        nowpaymentsInvoiceId: invoice_id ? String(invoice_id) : null,
        nowpaymentsPaymentId: payment_id ? String(payment_id) : null,
        note: "Direct crypto payment confirmed via NOWPayments",
      });
    }

    // Submit to supplier or queue for manual fulfillment
    await fulfillOrder(order);
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("NOWPayments order webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
