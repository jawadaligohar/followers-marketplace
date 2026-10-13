import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { nowpayments } from "@/lib/nowpayments";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
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

    const { payment_id, invoice_id, payment_status, order_id, price_amount } = body;

    if (payment_status !== "finished") {
      // We only care about completed payments for topups
      return NextResponse.json({ received: true, status: payment_status });
    }

    if (!order_id?.startsWith("topup_")) {
      return NextResponse.json({ received: true, note: "Ignored, not a topup" });
    }

    const userIdStr = order_id.split("_")[1];
    if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
      return NextResponse.json({ error: "Invalid userId in order_id" }, { status: 400 });
    }

    await dbConnect();

    const existingTx = await Transaction.findOne({ nowpaymentsPaymentId: String(payment_id) });
    if (existingTx) {
      return NextResponse.json({ received: true, note: "Already processed" });
    }

    const amountCents = Math.round(Number(price_amount) * 100);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userIdStr).session(session);
      if (!user) throw new Error("User not found");

      user.walletBalanceCents += amountCents;
      await user.save({ session });

      await Transaction.create(
        [
          {
            userId: user._id,
            type: "topup",
            amountCents,
            balanceAfterCents: user.walletBalanceCents,
            nowpaymentsInvoiceId: String(invoice_id),
            nowpaymentsPaymentId: String(payment_id),
            note: "Crypto Top-up via NOWPayments",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("NOWPayments webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
