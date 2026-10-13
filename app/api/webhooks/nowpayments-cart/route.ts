import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { nowpayments } from "@/lib/nowpayments";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { supplierClient } from "@/lib/supplier";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reqHeaders = await headers();
    const sig = reqHeaders.get("x-nowpayments-sig");

    if (!sig || !nowpayments.verifySignature(body, sig)) {
      console.error("NOWPayments Webhook: Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { payment_status, order_id } = body;

    if (payment_status !== "finished") {
      return NextResponse.json({ received: true, status: payment_status });
    }

    if (!order_id?.startsWith("cart_")) {
      return NextResponse.json({ received: true, note: "Ignored, not a cart" });
    }

    await dbConnect();

    const orders = await Order.find({ cryptoCheckoutId: order_id, status: "pending" });
    
    if (orders.length === 0) {
      return NextResponse.json({ received: true, note: "Orders already processed or not found" });
    }

    for (const order of orders) {
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
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("NOWPayments cart webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
