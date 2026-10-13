import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { nowpayments } from "@/lib/nowpayments";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { supplierClient } from "@/lib/supplier";
import { Transaction } from "@/lib/db/models/Transaction";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reqHeaders = await headers();
    const sig = reqHeaders.get("x-nowpayments-sig");

    if (!sig || !nowpayments.verifySignature(body, sig)) {
      console.error("NOWPayments Webhook: Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { payment_id, invoice_id, payment_status, order_id } = body;

    if (payment_status !== "finished") {
      return NextResponse.json({ received: true, status: payment_status });
    }

    if (!order_id?.startsWith("order_")) {
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

    // Submit to supplier
    try {
      const result = await supplierClient.submitOrder({
        supplierServiceId: order.serviceId?.toString() ?? "mock",
        link: order.targetLink,
        quantity: order.qtyValue,
      });
      order.supplierOrderId = result.supplierOrderId;
      order.supplierStatus = result.status;
      order.status = "processing";
    } catch (err: any) {
      console.error("Failed to submit order to supplier:", err);
      order.status = "failed";
      order.failureReason = "Supplier submission failed after payment";
    }

    await order.save();
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("NOWPayments order webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
