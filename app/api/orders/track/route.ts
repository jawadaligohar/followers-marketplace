import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { BankTransfer, BonusClaim } from "@/lib/db/models/Benefits";
import { bankInstructions } from "@/lib/bankTransfer";
import { sendMail } from "@/lib/mailer";
import { consumeLimit } from "@/lib/security/rateLimit";
import { trustedAppOrigin } from "@/lib/security/request";
import {
  groupQuery,
  orderGroupKey,
  orderAccessToken,
  verifyOrderAccessToken,
} from "@/lib/orderAccess";
const schema = z.object({
  token: z.string().max(512).optional(),
  orderId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  email: z.string().trim().max(254).email().optional(),
});
async function postHandler(request: Request) {
  const data = schema.safeParse(await request.json().catch(() => null));
  if (!data.success)
    return NextResponse.json(
      { error: "Enter a valid order ID and checkout email" },
      { status: 400 },
    );
  await dbConnect();
  const key = data.data.token ? verifyOrderAccessToken(data.data.token) : null;
  if (data.data.token && !key)
    return NextResponse.json(
      { error: "Invalid tracking link" },
      { status: 403 },
    );
  const session = await auth();
  let orders;
  if (key) orders = await Order.find(groupQuery(key)).sort({ _id: 1 }).lean();
  else if (data.data.orderId) {
    orders = session?.user ? await Order.find({ _id: data.data.orderId, userId: session.user.id }).lean() : [];
    if (!orders.length && data.data.email) {
      const email = data.data.email.toLowerCase();
      const limit = await consumeLimit("guest-tracking-email", email, 3, 3600000);
      if (limit.allowed) {
        const guest = await Order.findOne({ _id: data.data.orderId, userId: null, guestEmail: email }).lean();
        if (guest) {
          try {
            await sendMail({ to: email, subject: "Your private Surgeon tracking link", text: `Open your private order tracking link:\n${trustedAppOrigin(request)}/track-order?token=${encodeURIComponent(orderAccessToken(orderGroupKey(guest)))}`, idempotencyKey: `tracking:${guest._id}:${Math.floor(Date.now() / 3600000)}` });
          } catch { /* Keep the same public response for missing accounts or mail failures. */ }
        }
      }
      return NextResponse.json({ verificationRequired: true, message: "If these details match a guest order, a private tracking link has been queued for your checkout email. Use that link to view the order." });
    }
  } else
    return NextResponse.json(
      { error: "Enter your order details" },
      { status: 400 },
    );
  const transfer = key
    ? await BankTransfer.findOne({ reference: key }).lean()
    : null;
  if (!orders.length && !transfer)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const groupKey = key || orderGroupKey(orders[0]);
  const paid = orders.some(
    (o) =>
      o.paymentConfirmedAt &&
      o.paymentSource !== "bonus" &&
      o.priceCents > (o.refundedCents ?? 0),
  );
  const claimed = Boolean(await BonusClaim.exists({ groupKey }));
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: String(o._id),
      platformLabel: o.platformLabel,
      platformId: o.platformId,
      category: o.category,
      qtyValue: o.qtyValue,
      status: o.status,
      priceCents: o.priceCents,
      refundedCents: o.refundedCents || 0,
      paymentConfirmed: Boolean(o.paymentConfirmedAt),
      postsCovered: o.postsCovered,
      pollOption: o.pollOption,
    })),
    bonusAvailable: paid && !claimed,
    ...(transfer && {
      bankTransfer: {
        reference: transfer.reference,
        amountCents: transfer.amountCents,
        confirmed: Boolean(transfer.confirmedAt),
        instructions: bankInstructions(),
      },
    }),
  });
}

export const POST = secureRoute(postHandler);
