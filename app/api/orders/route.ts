import { randomUUID } from "node:crypto";
import { createWalletOrders, fulfillWalletOrders } from "@/lib/walletCheckout";
import { orderAccessToken } from "@/lib/orderAccess";
import { createBankTransfer, bankInstructions } from "@/lib/bankTransfer";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { createOrderSchema } from "@/lib/validation/order";
import { resolveLine, LineItemError, type ResolvedLine } from "@/lib/orderLine";
import { InsufficientBalanceError } from "@/lib/wallet";
import { stripe } from "@/lib/stripe";
import { nowpayments } from "@/lib/nowpayments";

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
      { status: 400 },
    );
  }

  const { paymentSource } = parsed.data;

  await dbConnect();

  let line: ResolvedLine;
  try {
    line = await resolveLine(parsed.data, paymentSource);
  } catch (err) {
    if (err instanceof LineItemError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
  const { chargeCents } = line;
  if (parsed.data.expectedTotalCents !== undefined && parsed.data.expectedTotalCents !== chargeCents) return NextResponse.json({ error: "Package prices changed. Refresh the page and review the new total before paying." }, { status: 409 });
  const checkoutGroupId = "checkout_" + randomUUID();
  const trackingToken = orderAccessToken(checkoutGroupId);
  if (paymentSource === "bank") {
    if (!bankInstructions())
      return NextResponse.json(
        { error: "Bank transfers are not configured yet" },
        { status: 503 },
      );
    const transfer = await createBankTransfer({
      email: session.user.email!,
      userId: session.user.id,
      lines: [line],
    });
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    return NextResponse.json({
      checkoutUrl:
        origin +
        "/checkout/bank-transfer?token=" +
        encodeURIComponent(transfer.token),
    });
  }

  if (paymentSource === "crypto") {
    const order = await Order.create({
      ...line.orderFields,
      checkoutGroupId,
      customerEmail: session.user.email,
      userId: session.user.id,
      paymentSource: "crypto",
      status: "pending",
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    try {
      const invoice = await nowpayments.createInvoice({
        price_amount: chargeCents / 100,
        price_currency: "usd",
        order_id: `order_${order._id.toString()}`,
        order_description: line.name,
        ipn_callback_url: `${origin}/api/webhooks/nowpayments-order`,
        success_url: `${origin}/checkout/success?token=${encodeURIComponent(trackingToken)}`,
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
    const order = await Order.create({
      ...line.orderFields,
      checkoutGroupId,
      customerEmail: session.user.email,
      userId: session.user.id,
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
              name: line.name,
            },
            unit_amount: chargeCents,
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "order_payment", checkoutGroupId },
      success_url: `${origin}/checkout/success?token=${encodeURIComponent(trackingToken)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: session.user.email ?? undefined,
    });

    order.stripeSessionId = checkoutSession.id;
    await order.save();

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  }

  try {
    const orders = await createWalletOrders(
      [line],
      session.user.id,
      session.user.email!,
      checkoutGroupId,
    );
    await fulfillWalletOrders(orders);
    return NextResponse.json({ order: orders[0] });
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
