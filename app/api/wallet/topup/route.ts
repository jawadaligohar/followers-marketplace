import { secureRoute } from "@/lib/security/request";
import { createBankTransfer, bankInstructions } from "@/lib/bankTransfer";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { topupSchema } from "@/lib/validation/order";
import { trustedAppOrigin } from "@/lib/security/request";
import { createTrackedCryptoInvoice } from "@/lib/security/cryptoPayment";
import { randomUUID } from "node:crypto";

async function postHandler(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = topupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const origin = trustedAppOrigin(req);
  const { amountCents, method } = parsed.data;

  if (method === "bank") {
    if (!bankInstructions()) return NextResponse.json({ error: "Bank transfers are not configured yet" }, { status: 503 });
    const transfer = await createBankTransfer({ email: session.user.email!, userId: session.user.id, topupCents: amountCents });
    return NextResponse.json({ checkoutUrl: origin + "/checkout/bank-transfer?token=" + encodeURIComponent(transfer.token) });
  }
  if (method === "nowpayments") {
    try {
      const orderId = `topup_${randomUUID()}`;
      
      const invoice = await createTrackedCryptoInvoice({
        price_amount: amountCents / 100, // convert cents to dollars
        price_currency: "usd",
        order_id: orderId,
        order_description: "Wallet Top-up",
        ipn_callback_url: `${origin}/api/webhooks/nowpayments`,
        success_url: `${origin}/checkout/success`,
        cancel_url: `${origin}/checkout/cancel`,
      }, amountCents, session.user.id);

      return NextResponse.json({ checkoutUrl: invoice.invoice_url });
    } catch (err: unknown) {
      console.error("NOWPayments invoice creation error:", err);
      const errMessage = err instanceof Error ? err.message : "";
      const errorResponse = errMessage.includes("API key is not configured")
        ? "Crypto payment gateway is not yet configured with an API key. Please use Card payment or configure NOWPAYMENTS_API_KEY in your environment."
        : "Failed to create crypto invoice. Please try again or use Card payment.";
      return NextResponse.json({ error: errorResponse }, { status: 500 });
    }
  }

  // Fallback to Stripe
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Wallet Top-up" },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { kind: "wallet_topup", userId: session.user.id },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    customer_email: session.user.email ?? undefined,
  });

  return NextResponse.json({ checkoutUrl: checkoutSession.url });
}

export const POST = secureRoute(postHandler);
