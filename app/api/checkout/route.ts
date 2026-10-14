import { randomUUID } from "node:crypto";
import { createWalletOrders, fulfillWalletOrders } from "@/lib/walletCheckout";
import { orderAccessToken } from "@/lib/orderAccess";
import { createBankTransfer, bankInstructions } from "@/lib/bankTransfer";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { checkoutSchema } from "@/lib/validation/checkout";
import { resolveLine, LineItemError, type ResolvedLine } from "@/lib/orderLine";
import { InsufficientBalanceError } from "@/lib/wallet";
import { stripe } from "@/lib/stripe";
import { nowpayments } from "@/lib/nowpayments";

export async function POST(req: Request) {
  const session = await auth();

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { items, paymentSource } = parsed.data;
  const guestEmail = parsed.data.guestEmail?.toLowerCase().trim();

  if (!session?.user && paymentSource === "wallet") {
    return NextResponse.json(
      { error: "Sign in to pay from your wallet" },
      { status: 401 },
    );
  }
  if (!session?.user && !guestEmail) {
    return NextResponse.json(
      { error: "Email is required for guest checkout" },
      { status: 400 },
    );
  }

  await dbConnect();

  const resolved: ResolvedLine[] = [];
  for (const item of items) {
    try {
      resolved.push(await resolveLine(item, paymentSource));
    } catch (err) {
      if (err instanceof LineItemError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status },
        );
      }
      throw err;
    }
  }

  const totalChargeCents = resolved.reduce((sum, r) => sum + r.chargeCents, 0);
  if (parsed.data.expectedTotalCents !== undefined && parsed.data.expectedTotalCents !== totalChargeCents) return NextResponse.json({ error: "Package prices changed. Refresh checkout and review the new total before paying." }, { status: 409 });

  const checkoutGroupId = "checkout_" + randomUUID();
  const trackingToken = orderAccessToken(checkoutGroupId);
  const checkoutOrigin =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  if (paymentSource === "bank") {
    if (!bankInstructions())
      return NextResponse.json(
        { error: "Bank transfers are not configured yet" },
        { status: 503 },
      );
    const transfer = await createBankTransfer({
      email: session?.user?.email || guestEmail!,
      userId: session?.user?.id,
      lines: resolved,
    });
    return NextResponse.json({
      checkoutUrl:
        checkoutOrigin +
        "/checkout/bank-transfer?token=" +
        encodeURIComponent(transfer.token),
    });
  }
  if (paymentSource === "crypto") {
    const cryptoCheckoutId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await Order.insertMany(
      resolved.map((r) => ({
        ...r.orderFields,
        checkoutGroupId,
        customerEmail: session?.user?.email || guestEmail,
        userId: session?.user?.id ?? null,
        guestEmail: session?.user ? null : guestEmail,
        paymentSource: "crypto",
        status: "pending",
        cryptoCheckoutId,
      })),
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
          ? `${origin}/checkout/success?token=${encodeURIComponent(trackingToken)}`
          : `${origin}/checkout/success?token=${encodeURIComponent(trackingToken)}&guest_email=${encodeURIComponent(guestEmail!)}`,
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
        ...r.orderFields,
        checkoutGroupId,
        customerEmail: session?.user?.email || guestEmail,
        userId: session?.user?.id ?? null,
        guestEmail: session?.user ? null : guestEmail,
        paymentSource: "card",
        status: "pending",
      })),
    );

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: resolved.map((r) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: r.name,
          },
          unit_amount: r.chargeCents,
        },
        quantity: 1,
      })),
      metadata: {
        kind: "order_payment",
        checkoutGroupId,
      },
      success_url: session?.user
        ? `${origin}/checkout/success?token=${encodeURIComponent(trackingToken)}&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/checkout/success?token=${encodeURIComponent(trackingToken)}&session_id={CHECKOUT_SESSION_ID}&guest_email=${encodeURIComponent(guestEmail!)}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: session?.user?.email ?? guestEmail,
    });

    await Order.updateMany(
      { _id: { $in: orders.map((o) => o._id) } },
      { $set: { stripeSessionId: checkoutSession.id } },
    );

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  }

  try {
    const orders = await createWalletOrders(
      resolved,
      session!.user.id,
      session!.user.email!,
      checkoutGroupId,
    );
    await fulfillWalletOrders(orders);
    return NextResponse.json({ orders });
  } catch (error) {
    if (error instanceof InsufficientBalanceError)
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          shortfallCents: error.shortfallCents,
        },
        { status: 402 },
      );
    throw error;
  }
}
