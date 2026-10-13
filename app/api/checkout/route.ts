import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Service } from "@/lib/db/models/Service";
import type { IService } from "@/lib/db/models/Service";
import { Order } from "@/lib/db/models/Order";
import { checkoutSchema } from "@/lib/validation/checkout";
import { walletPriceCents } from "@/lib/pricing";
import { applyWalletTransaction, InsufficientBalanceError } from "@/lib/wallet";
import { fulfillOrder } from "@/lib/supplier/fulfillment";
import { stripe } from "@/lib/stripe";
import { nowpayments } from "@/lib/nowpayments";

export async function POST(req: Request) {
  const session = await auth();

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { items, paymentSource } = parsed.data;
  const guestEmail = parsed.data.guestEmail?.toLowerCase().trim();

  if (!session?.user && paymentSource === "wallet") {
    return NextResponse.json({ error: "Sign in to pay from your wallet" }, { status: 401 });
  }
  if (!session?.user && !guestEmail) {
    return NextResponse.json({ error: "Email is required for guest checkout" }, { status: 400 });
  }

  await dbConnect();

  // Re-derive every line's price server-side from the Service tiers; client-sent prices are never trusted.
  const resolved: {
    service: IService;
    tier: { qty: string; qtyValue: number; priceCents: number };
    targetLink: string;
    fullPriceCents: number;
    chargeCents: number;
  }[] = [];

  for (const item of items) {
    const service = await Service.findById(item.serviceId);
    if (!service || !service.active) {
      return NextResponse.json({ error: "One of the services in your cart is no longer available" }, { status: 404 });
    }
    const tier = service.tiers.find((t: { qtyValue: number }) => t.qtyValue === item.qtyValue);
    if (!tier) {
      return NextResponse.json({ error: "Invalid quantity for one of your cart items" }, { status: 400 });
    }
    const fullPriceCents = tier.priceCents;
    const chargeCents = paymentSource === "wallet" ? walletPriceCents(fullPriceCents) : fullPriceCents;
    resolved.push({ service, tier, targetLink: item.targetLink, fullPriceCents, chargeCents });
  }

  const totalChargeCents = resolved.reduce((sum, r) => sum + r.chargeCents, 0);

  if (paymentSource === "crypto") {
    const cryptoCheckoutId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const orders = await Order.insertMany(
      resolved.map((r) => ({
        userId: session?.user?.id ?? null,
        guestEmail: session?.user ? null : guestEmail,
        serviceId: r.service._id,
        platformId: r.service.platformId,
        platformLabel: r.service.platformLabel,
        category: r.service.category,
        qtyValue: r.tier.qtyValue,
        targetLink: r.targetLink,
        priceCents: r.chargeCents,
        paymentSource: "crypto",
        status: "pending",
        cryptoCheckoutId,
      }))
    );

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    try {
      const invoice = await nowpayments.createInvoice({
        price_amount: totalChargeCents / 100,
        price_currency: "usd",
        order_id: cryptoCheckoutId,
        order_description: `${resolved.length} items from cart`,
        ipn_callback_url: `${origin}/api/webhooks/nowpayments-cart`,
        success_url: session?.user
          ? `${origin}/checkout/success`
          : `${origin}/checkout/success?guest_email=${encodeURIComponent(guestEmail!)}`,
        cancel_url: `${origin}/checkout/cancel`,
      });

      return NextResponse.json({ checkoutUrl: invoice.invoice_url });
    } catch (err: unknown) {
      console.error("Crypto invoice creation failed:", err);
      const errMessage = err instanceof Error ? err.message : "";
      const errorResponse = errMessage.includes("API key is not configured")
        ? "Crypto payment gateway is not yet configured with an API key. Please use Card payment or configure NOWPAYMENTS_API_KEY in your environment."
        : "Failed to initialize crypto payment. Please try again or use Card payment.";
      return NextResponse.json({ error: errorResponse }, { status: 500 });
    }
  }

  if (paymentSource === "card") {
    const orders = await Order.insertMany(
      resolved.map((r) => ({
        userId: session?.user?.id ?? null,
        guestEmail: session?.user ? null : guestEmail,
        serviceId: r.service._id,
        platformId: r.service.platformId,
        platformLabel: r.service.platformLabel,
        category: r.service.category,
        qtyValue: r.tier.qtyValue,
        targetLink: r.targetLink,
        priceCents: r.chargeCents,
        paymentSource: "card",
        status: "pending",
      }))
    );

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: resolved.map((r) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${r.service.platformLabel} ${r.service.category} — ${r.tier.qty}`,
          },
          unit_amount: r.chargeCents,
        },
        quantity: 1,
      })),
      metadata: {
        kind: "order_payment",
        orderIds: orders.map((o) => o._id.toString()).join(","),
      },
      success_url: session?.user
        ? `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&guest_email=${encodeURIComponent(guestEmail!)}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: session?.user?.email ?? guestEmail,
    });

    await Order.updateMany(
      { _id: { $in: orders.map((o) => o._id) } },
      { $set: { stripeSessionId: checkoutSession.id } }
    );

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  }

  // Wallet path (logged-in only): debit once for the whole cart, then submit each order.
  try {
    await applyWalletTransaction({
      userId: session!.user.id,
      type: "order_debit",
      amountCents: -totalChargeCents,
      note: resolved.length === 1
        ? `${resolved[0].service.platformLabel} ${resolved[0].service.category} — ${resolved[0].tier.qty}`
        : `${resolved.length} items from cart`,
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

  const createdOrders = [];
  for (const r of resolved) {
    const order = await Order.create({
      userId: session!.user.id,
      serviceId: r.service._id,
      platformId: r.service.platformId,
      platformLabel: r.service.platformLabel,
      category: r.service.category,
      qtyValue: r.tier.qtyValue,
      targetLink: r.targetLink,
      priceCents: r.chargeCents,
      paymentSource: "wallet",
      status: "pending",
    });

    const fulfillment = await fulfillOrder(order);
    if (!fulfillment.success && fulfillment.mode === "automated") {
      order.status = "failed";
      await order.save();

      await applyWalletTransaction({
        userId: session!.user.id,
        type: "refund",
        amountCents: r.chargeCents,
        relatedOrderId: order._id,
        note: `Refund: ${fulfillment.error || "Supplier submission failed"}`,
      });
    }

    createdOrders.push(order);
  }

  return NextResponse.json({ orders: createdOrders });
}
