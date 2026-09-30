import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { topupSchema } from "@/lib/validation/order";

export async function POST(req: Request) {
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

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Wallet Top-up" },
          unit_amount: parsed.data.amountCents,
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
