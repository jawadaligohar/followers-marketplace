import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Service } from "@/lib/db/models/Service";
import { Order } from "@/lib/db/models/Order";
import { createOrderSchema } from "@/lib/validation/order";
import { walletPriceCents } from "@/lib/pricing";
import { applyWalletTransaction, InsufficientBalanceError } from "@/lib/wallet";
import { supplierClient } from "@/lib/supplier";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const orders = await Order.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { serviceId, qtyValue, targetLink, paymentSource } = parsed.data;

  await dbConnect();

  const service = await Service.findById(serviceId);
  if (!service || !service.active) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const tier = service.tiers.find((t: { qtyValue: number }) => t.qtyValue === qtyValue);
  if (!tier) {
    return NextResponse.json({ error: "Invalid quantity for this service" }, { status: 400 });
  }

  // Price is always re-derived server-side from the Service tier; client-sent price is never trusted.
  const fullPriceCents = tier.priceCents;
  const chargeCents = paymentSource === "wallet" ? walletPriceCents(fullPriceCents) : fullPriceCents;

  if (paymentSource === "card") {
    const order = await Order.create({
      userId: session.user.id,
      serviceId: service._id,
      platformId: service.platformId,
      platformLabel: service.platformLabel,
      category: service.category,
      qtyValue,
      targetLink,
      priceCents: chargeCents,
      paymentSource: "card",
      status: "pending",
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${service.platformLabel} ${service.category} — ${tier.qty}`,
            },
            unit_amount: chargeCents,
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "order_payment", orderId: order._id.toString() },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: session.user.email ?? undefined,
    });

    order.stripeSessionId = checkoutSession.id;
    await order.save();

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  }

  // Wallet path: debit synchronously and submit to the supplier immediately.
  try {
    await applyWalletTransaction({
      userId: session.user.id,
      type: "order_debit",
      amountCents: -chargeCents,
      note: `${service.platformLabel} ${service.category} — ${tier.qty}`,
    });
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: "Insufficient wallet balance", shortfallCents: err.shortfallCents },
        { status: 402 }
      );
    }
    throw err;
  }

  const order = await Order.create({
    userId: session.user.id,
    serviceId: service._id,
    platformId: service.platformId,
    platformLabel: service.platformLabel,
    category: service.category,
    qtyValue,
    targetLink,
    priceCents: chargeCents,
    paymentSource: "wallet",
    status: "pending",
  });

  try {
    const result = await supplierClient.submitOrder({
      supplierServiceId: service.supplierServiceId ?? "mock",
      link: targetLink,
      quantity: qtyValue,
    });
    order.supplierOrderId = result.supplierOrderId;
    order.supplierStatus = result.status;
    order.status = "processing";
    await order.save();
  } catch {
    order.status = "failed";
    order.failureReason = "Supplier submission failed";
    await order.save();

    await applyWalletTransaction({
      userId: session.user.id,
      type: "refund",
      amountCents: chargeCents,
      relatedOrderId: order._id,
      note: "Refund for failed supplier submission",
    });
  }

  return NextResponse.json({ order });
}
