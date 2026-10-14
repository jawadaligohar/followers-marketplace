import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { nowpayments } from "@/lib/nowpayments";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { Transaction } from "@/lib/db/models/Transaction";
import { applyWalletTransaction } from "@/lib/wallet";
import mongoose from "mongoose";
import { validateCryptoPayment } from "@/lib/security/cryptoPayment";

async function postHandler(req: Request) {
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

    const { payment_id, invoice_id, payment_status, order_id, pay_currency } = body;

    // In NOWPayments, 'confirmed' or 'finished' indicates full blockchain confirmation
    if (payment_status !== "finished") {
      return NextResponse.json({ received: true, status: payment_status });
    }

    if (typeof order_id !== "string" || !order_id.startsWith("topup_")) {
      return NextResponse.json({ received: true, note: "Ignored, not a topup" });
    }

    const invoice = await validateCryptoPayment(body);
    const userIdStr = invoice.userId ? String(invoice.userId) : null;
    if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
      return NextResponse.json({ error: "Invalid userId in order_id" }, { status: 400 });
    }

    await dbConnect();

    // Idempotency: verify this payment has not already been processed
    const existingTx = await Transaction.findOne({ nowpaymentsPaymentId: String(payment_id) });
    if (existingTx) {
      return NextResponse.json({ received: true, note: "Already processed" });
    }

    const user = await User.findById(userIdStr);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const amountCents = invoice.amountCents;
    if (amountCents <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    await applyWalletTransaction({
      userId: user._id,
      type: "topup",
      amountCents,
      nowpaymentsInvoiceId: String(invoice_id),
      nowpaymentsPaymentId: String(payment_id),
      note: `Crypto top-up via NOWPayments${pay_currency ? ` (${String(pay_currency).toUpperCase()})` : ""}`,
    });

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("NOWPayments topup webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

export const POST = secureRoute(postHandler);
