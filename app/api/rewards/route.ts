import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { monthlyDrawPool, rewardSummary, redeemRewards } from "@/lib/benefits";
import { DRAW_ENTRY_CENTS } from "@/lib/benefitMath";
import { Order } from "@/lib/db/models/Order";
import { orderGroupKey } from "@/lib/orderAccess";
import { BonusClaim } from "@/lib/db/models/Benefits";
export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json(
      { error: "Sign in to view rewards" },
      { status: 401 },
    );
  await dbConnect();
  const month = new Date().toISOString().slice(0, 7);
  const [summary, pool, orders] = await Promise.all([
    rewardSummary(session.user.id),
    monthlyDrawPool(month, session.user.id),
    Order.find({
      userId: session.user.id,
      paymentConfirmedAt: { $ne: null },
      paymentSource: { $ne: "bonus" },
      $expr: { $gt: ["$priceCents", { $ifNull: ["$refundedCents", 0] }] },
    })
      .select(
        "checkoutGroupId stripeSessionId cryptoCheckoutId platformId platformLabel",
      )
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const claims = await BonusClaim.find({
    groupKey: { $in: orders.map(orderGroupKey) },
  })
    .select("groupKey")
    .lean();
  const used = new Set(claims.map((claim) => claim.groupKey));
  const groups = new Map<
    string,
    {
      orderId: string;
      platformId: string;
      platformLabel: string;
      claimed: boolean;
    }
  >();
  for (const order of [...orders].reverse()) {
    const key = orderGroupKey(order);
    if (!groups.has(key))
      groups.set(key, {
        orderId: String(order._id),
        platformId: order.platformId,
        platformLabel: order.platformLabel,
        claimed: used.has(key),
      });
  }
  const entry = pool.find((row) => row.userId === session.user.id);
  return NextResponse.json({
    ...summary,
    month,
    entries: entry?.entries || 0,
    qualifyingCents: entry?.qualifyingCents || 0,
    entryThresholdCents: DRAW_ENTRY_CENTS,
    bonuses: [...groups.values()].reverse(),
  });
}
export async function POST() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json(
      { error: "Sign in to redeem rewards" },
      { status: 401 },
    );
  try {
    return NextResponse.json({
      creditedCents: await redeemRewards(session.user.id),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not redeem rewards",
      },
      { status: 400 },
    );
  }
}
