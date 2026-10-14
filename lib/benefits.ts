import { randomInt, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { Service } from "@/lib/db/models/Service";
import { User } from "@/lib/db/models/User";
import { Transaction } from "@/lib/db/models/Transaction";
import {
  BonusClaim,
  EmailOutbox,
  LuckyDraw,
  RewardRedemption,
  RefundRecord,
} from "@/lib/db/models/Benefits";
import {
  BONUS_LIKES,
  drawEntries,
  loyaltyCreditCents,
  monthBounds,
} from "@/lib/benefitMath";
import { groupQuery, orderAccessToken, orderGroupKey } from "@/lib/orderAccess";
import { sendMail } from "@/lib/mailer";
import { fulfillOrder } from "@/lib/supplier/fulfillment";
import { trustedAppOrigin } from "@/lib/security/request";

export async function markOrdersPaid(ids: string[]) {
  await dbConnect();
  await Order.updateMany(
    {
      _id: { $in: ids },
      paymentConfirmedAt: null,
      paymentSource: { $ne: "bonus" },
    },
    { $set: { paymentConfirmedAt: new Date() } },
  );
  const first = await Order.findById(ids[0]);
  if (!first) return;
  const groupKey = orderGroupKey(first);
  const email =
    first.customerEmail ||
    first.guestEmail ||
    (first.userId ? (await User.findById(first.userId))?.email : null);
  if (!email) return;
  const origin = trustedAppOrigin();
  const token = orderAccessToken(groupKey);
  const message = await EmailOutbox.findOneAndUpdate(
    { key: `paid:${groupKey}` },
    {
      $setOnInsert: {
        to: email,
        subject: "Your order and 50 free likes",
        text: `Your payment is confirmed. Track your package here:\n${origin}/track-order?token=${encodeURIComponent(token)}\n\nClaim 50 free likes for a public post on ${first.platformLabel}:\n${origin}/rewards/claim?token=${encodeURIComponent(token)}\n\nThis bonus is available once for this checkout.`,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (message.status === "pending") {
    try {
      if (
        await sendMail({
          to: message.to,
          subject: message.subject,
          text: message.text,
          idempotencyKey: message.key,
        })
      ) {
        message.status = "sent";
        await message.save();
      }
    } catch {
      /* Keep the outbox message pending for an admin retry. */
    }
  }
}

export async function claimBonus(groupKey: string, targetLink: string) {
  await dbConnect();
  await BonusClaim.init();
  let createdId = "";
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const orders = await Order.find(groupQuery(groupKey))
        .sort({ _id: 1 })
        .session(session);
      const source = orders[0];
      if (
        !source ||
        !orders.some(
          (o) =>
            o.paymentConfirmedAt &&
            o.paymentSource !== "bonus" &&
            o.priceCents > (o.refundedCents ?? 0),
        )
      )
        throw new Error("This checkout has no confirmed, non-refunded payment");
      if (await BonusClaim.exists({ groupKey }).session(session))
        throw new Error("The bonus for this checkout has already been claimed");
      const slug =
        source.platformId === "facebook"
          ? "facebook-post-likes"
          : `${source.platformId}-likes`;
      const service = await Service.findOne({ slug, active: true }).session(
        session,
      );
      if (!service)
        throw new Error("The bonus service is temporarily unavailable");
      const [order] = await Order.create(
        [
          {
            userId: source.userId,
            guestEmail: source.guestEmail,
            customerEmail: source.customerEmail,
            serviceId: service._id,
            platformId: service.platformId,
            platformLabel: service.platformLabel,
            category: `${service.category} (free bonus)`,
            qtyValue: BONUS_LIKES,
            targetLink,
            priceCents: 0,
            paymentSource: "bonus",
            status: "pending",
            serviceKind: "standard",
            checkoutGroupId: `bonus_${randomUUID()}`,
          },
        ],
        { session },
      );
      await BonusClaim.create(
        [{ groupKey, sourceOrderId: source._id, orderId: order._id }],
        { session },
      );
      createdId = String(order._id);
    });
  } finally {
    await session.endSession();
  }
  // A supplier mapping may have a minimum above 50; failures remain visible for manual fulfillment.
  await fulfillOrder(createdId);
  return {
    orderId: createdId,
    trackingToken: orderAccessToken(`order_${createdId}`),
  };
}

export async function rewardSummary(
  userId: string,
  session?: mongoose.ClientSession,
) {
  const orders = await Order.find({
    userId,
    paymentConfirmedAt: { $ne: null },
    paymentSource: { $ne: "bonus" },
  })
    .select("priceCents refundedCents")
    .session(session ?? null)
    .lean();
  const redemptions = await RewardRedemption.find({ userId })
    .select("kind amountCents drawId")
    .session(session ?? null)
    .lean();
  const earnedCents = loyaltyCreditCents(
    orders.reduce(
      (sum, order) =>
        sum + Math.max(0, order.priceCents - (order.refundedCents ?? 0)),
      0,
    ),
  );
  const redeemedCents = redemptions
    .filter((r) => r.kind === "loyalty")
    .reduce((sum, r) => sum + r.amountCents, 0);
  const user = await User.findById(userId)
    .select("email emailVerified")
    .session(session ?? null)
    .lean();
  const draws = await LuckyDraw.find({
    $or: [
      { winnerUserId: userId },
      ...(user?.emailVerified
        ? [{ winnerUserId: null, winnerEmail: user.email }]
        : []),
    ],
  })
    .session(session ?? null)
    .lean();
  const claimedDraws = new Set(
    redemptions.filter((r) => r.kind === "draw").map((r) => String(r.drawId)),
  );
  const prizes = draws
    .filter((draw) => !claimedDraws.has(String(draw._id)))
    .map((draw) => ({
      id: String(draw._id),
      month: draw.month,
      amountCents: draw.prizeCents,
    }));
  return {
    earnedCents,
    redeemedCents,
    availableCents: Math.max(0, earnedCents - redeemedCents),
    prizes,
    emailVerified: Boolean(user?.emailVerified),
  };
}

export async function redeemRewards(userId: string) {
  await dbConnect();
  await RewardRedemption.init();
  const session = await mongoose.startSession();
  let creditedCents = 0;
  try {
    await session.withTransaction(async () => {
      const summary = await rewardSummary(userId, session);
      creditedCents =
        summary.availableCents +
        summary.prizes.reduce((sum, prize) => sum + prize.amountCents, 0);
      if (!creditedCents) throw new Error("No reward credit is available");
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { walletBalanceCents: creditedCents } },
        { returnDocument: "after", session },
      );
      if (!user) throw new Error("Account not found");
      const rows = [
        ...(summary.availableCents
          ? [{ userId, amountCents: summary.availableCents, kind: "loyalty" }]
          : []),
        ...summary.prizes.map((prize) => ({
          userId,
          amountCents: prize.amountCents,
          kind: "draw",
          drawId: prize.id,
        })),
      ];
      await RewardRedemption.insertMany(rows, { session });
      await Transaction.create(
        [
          {
            userId,
            type: "reward_credit",
            amountCents: creditedCents,
            balanceAfterCents: user.walletBalanceCents,
            note: "Loyalty and monthly draw rewards redeemed",
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
  return creditedCents;
}

export async function monthlyDrawPool(month: string, onlyUserId?: string) {
  const { from, to } = monthBounds(month);
  const pool = new Map<
    string,
    {
      key: string;
      userId: string | null;
      email: string;
      qualifyingCents: number;
      orderIds: string[];
    }
  >();
  const orders = await Order.find({
    ...(onlyUserId ? { userId: onlyUserId } : {}),
    paymentConfirmedAt: { $gte: from, $lt: to },
    paymentSource: { $nin: ["bonus", "wallet"] },
  })
    .select("userId customerEmail guestEmail priceCents refundedCents")
    .lean();
  const topups = await Transaction.find({
    ...(onlyUserId ? { userId: onlyUserId } : {}),
    createdAt: { $gte: from, $lt: to },
    type: "topup",
  })
    .select("userId type amountCents relatedOrderId")
    .lean();
  const ownedOrderIds = onlyUserId
    ? await Order.find({ userId: onlyUserId }).distinct("_id")
    : null;
  const refunds = await RefundRecord.find({
    ...(ownedOrderIds ? { orderId: { $in: ownedOrderIds } } : {}),
    createdAt: { $gte: from, $lt: to },
  }).lean();
  const refundedOrders = await Order.find({
    _id: { $in: refunds.map((refund) => refund.orderId) },
    ...(onlyUserId ? { userId: onlyUserId } : {}),
  })
    .select("userId customerEmail guestEmail paymentSource")
    .lean();
  const refundedById = new Map(
    refundedOrders.map((order) => [String(order._id), order]),
  );
  const userIds = [
    ...new Set(
      [
        ...orders.map((o) => String(o.userId || "")),
        ...topups.map((t) => String(t.userId)),
        ...refundedOrders.map((order) => String(order.userId || "")),
      ].filter(Boolean),
    ),
  ];
  const users = await User.find({ _id: { $in: userIds } })
    .select("email")
    .lean();
  const emails = new Map(users.map((u) => [String(u._id), String(u.email)]));
  for (const order of orders) {
    const userId = order.userId ? String(order.userId) : null;
    const email =
      emails.get(userId || "") || order.customerEmail || order.guestEmail;
    if (!email) continue;
    const key = userId ? `user:${userId}` : `guest:${email}`;
    const row = pool.get(key) || {
      key,
      userId,
      email,
      qualifyingCents: 0,
      orderIds: [] as string[],
    };
    row.qualifyingCents += order.priceCents;
    row.orderIds.push(String(order._id));
    pool.set(key, row);
  }
  for (const transaction of topups) {
    const userId = String(transaction.userId);
    const email = emails.get(userId);
    if (!email) continue;
    const key = `user:${userId}`;
    const row = pool.get(key) || {
      key,
      userId,
      email,
      qualifyingCents: 0,
      orderIds: [] as string[],
    };
    row.qualifyingCents += transaction.amountCents;
    pool.set(key, row);
  }
  // Refunds reduce the month in which they are posted, preserving closed-month entries.
  for (const refund of refunds) {
    const order = refundedById.get(String(refund.orderId));
    if (!order || order.paymentSource === "bonus") continue;
    const userId = order.userId ? String(order.userId) : null;
    const email =
      emails.get(userId || "") || order.customerEmail || order.guestEmail;
    if (!email) continue;
    const key = userId ? `user:${userId}` : `guest:${email}`;
    const row = pool.get(key) || {
      key,
      userId,
      email,
      qualifyingCents: 0,
      orderIds: [] as string[],
    };
    row.qualifyingCents -= refund.amountCents;
    pool.set(key, row);
  }
  return [...pool.values()].map((row) => ({
    ...row,
    qualifyingCents: Math.max(0, row.qualifyingCents),
    entries: drawEntries(row.qualifyingCents),
  }));
}

export async function runMonthlyDraw(month: string, prizeCents: number) {
  await dbConnect();
  await LuckyDraw.init();
  if (
    !Number.isSafeInteger(prizeCents) ||
    prizeCents < 1 ||
    prizeCents > 1000000
  )
    throw new Error("Enter a prize from $0.01 to $10,000");
  const { to } = monthBounds(month);
  if (to > new Date())
    throw new Error(
      "Entries lock at the end of the month. Choose a completed month",
    );
  const pool = (await monthlyDrawPool(month)).filter((row) => row.entries);
  const totalEntries = pool.reduce((sum, row) => sum + row.entries, 0);
  if (!totalEntries) throw new Error("No qualifying entries for this month");
  let ticket = randomInt(totalEntries);
  const winner = pool.find((row) => {
    ticket -= row.entries;
    return ticket < 0;
  })!;
  const draw = await LuckyDraw.create({
    month,
    winnerUserId: winner.userId,
    winnerEmail: winner.email,
    sourceOrderIds: winner.orderIds,
    totalEntries,
    prizeCents,
  });
  await EmailOutbox.create({
    key: `draw:${draw._id}`,
    to: winner.email,
    subject: "You won the monthly draw",
    text: `You won $${(prizeCents / 100).toFixed(2)} in wallet credit for ${month}. Sign in to claim it from your Rewards page. Guest winners must verify this email address on their account before redeeming their prize.`,
  });
  return draw;
}
