import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { BankTransfer, EmailOutbox, LuckyDraw } from "@/lib/db/models/Benefits";
import { confirmBankTransfer } from "@/lib/bankTransfer";
import { runMonthlyDraw } from "@/lib/benefits";
import { sendMail } from "@/lib/mailer";
import { Order } from "@/lib/db/models/Order";
import { applyWalletTransaction } from "@/lib/wallet";
import { recordExternalRefund } from "@/lib/refunds";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("refundWallet"), orderId: z.string().regex(/^[a-f\d]{24}$/i), amountCents: z.number().int().positive() }),
  z.object({ action: z.literal("recordRefund"), orderId: z.string().regex(/^[a-f\d]{24}$/i), amountCents: z.number().int().positive() }),
  z.object({
    action: z.literal("confirmBank"),
    reference: z.string().regex(/^bank_[a-f\d-]{36}$/i),
  }),
  z.object({
    action: z.literal("draw"),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    prizeCents: z.number().int().min(1).max(1000000),
  }),
  z.object({
    action: z.literal("sendEmail"),
    id: z.string().regex(/^[a-f\d]{24}$/i),
  }),
]);
async function getHandler() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await dbConnect();
  const [transfers, draws, emails] = await Promise.all([
    BankTransfer.find({ confirmedAt: null }).sort({ createdAt: -1 }).lean(),
    LuckyDraw.find({}).sort({ month: -1 }).lean(),
    EmailOutbox.find({ status: "pending" })
      .select("to subject createdAt")
      .lean(),
  ]);
  return NextResponse.json({
    transfers,
    draws,
    emails,
    emailConfigured: Boolean(
      process.env.RESEND_API_KEY && process.env.EMAIL_FROM,
    ),
  });
}
async function postHandler(request: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await dbConnect();
  try {
    const data = parsed.data;
    if (data.action === "refundWallet" || data.action === "recordRefund") {
      const order = await Order.findById(data.orderId);
      if (!order?.paymentConfirmedAt || order.paymentSource === "bonus") throw new Error("Only confirmed paid orders can be refunded");
      if (data.action === "refundWallet") {
        if (!order.userId) throw new Error("Link the guest order to an account before issuing wallet credit");
        await applyWalletTransaction({ userId: order.userId, type: "refund", amountCents: data.amountCents, relatedOrderId: order._id, note: "Refund to wallet credit, confirmed by staff" });
        const updated = await Order.findById(order._id);
        if (updated.refundedCents === updated.priceCents) { updated.status = "cancelled"; await updated.save(); }
      } else await recordExternalRefund([String(order._id)], data.amountCents, `manual:${order._id}`);
    }
    if (data.action === "confirmBank")
      await confirmBankTransfer(data.reference);
    if (data.action === "draw")
      await runMonthlyDraw(data.month, data.prizeCents);
    if (data.action === "sendEmail") {
      const message = await EmailOutbox.findById(data.id);
      if (!message || message.status !== "pending")
        throw new Error("Email is no longer pending");
      if (
        !(await sendMail({
          to: message.to,
          subject: message.subject,
          text: message.text,
          idempotencyKey: message.key,
        }))
      )
        throw new Error("Configure RESEND_API_KEY and EMAIL_FROM first");
      message.status = "sent";
      await message.save();
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed" },
      { status: 400 },
    );
  }
}

export const GET = secureRoute(getHandler);
export const POST = secureRoute(postHandler);
