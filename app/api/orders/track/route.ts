import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { BankTransfer, BonusClaim } from "@/lib/db/models/Benefits";
import { bankInstructions } from "@/lib/bankTransfer";
import {
  groupQuery,
  orderGroupKey,
  verifyOrderAccessToken,
} from "@/lib/orderAccess";
const schema = z.object({
  token: z.string().max(512).optional(),
  orderId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  email: z.email().optional(),
});
export async function POST(request: Request) {
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
    orders = await Order.find({
      _id: data.data.orderId,
      $or: [
        ...(session?.user ? [{ userId: session.user.id }] : []),
        ...(data.data.email
          ? [{ userId: null, guestEmail: data.data.email.toLowerCase() }]
          : []),
      ],
    }).lean();
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
