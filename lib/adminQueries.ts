import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { User } from "@/lib/db/models/User";
import { Service } from "@/lib/db/models/Service";
import { Transaction } from "@/lib/db/models/Transaction";
import { BankTransfer, EmailOutbox } from "@/lib/db/models/Benefits";
import type { AdminOrderRow } from "@/components/admin/OrdersTable";
import type { IOrder } from "@/lib/db/models/Order";
import { SUPPLIER_ROUTES } from "@/lib/supplier/routing";
export type AdminSearch = Record<string, string | string[] | undefined>;
export function searchValue(search: AdminSearch, key: string) {
  return typeof search[key] === "string"
    ? search[key].trim().slice(0, 160)
    : "";
}
export function searchRegex(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}
export function pageNumber(search: AdminSearch) {
  const page = Number(searchValue(search, "page"));
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1;
}
export const ADMIN_PAGE_SIZE = 25;
const paid = {
  paymentConfirmedAt: { $ne: null },
  paymentSource: { $ne: "bonus" },
};
const net = {
  $max: [0, { $subtract: ["$priceCents", { $ifNull: ["$refundedCents", 0] }] }],
};

export async function getAdminMetrics(now = new Date()) {
  await dbConnect();
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 29);
  since.setUTCHours(0, 0, 0, 0);
  const [
    orderResults,
    userResults,
    ledger,
    pendingBank,
    emailResults,
    serviceResults,
  ] = await Promise.all([
    Order.aggregate([
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                guest: {
                  $sum: {
                    $cond: [
                      { $eq: [{ $ifNull: ["$userId", null] }, null] },
                      1,
                      0,
                    ],
                  },
                },
                bonuses: {
                  $sum: { $cond: [{ $eq: ["$paymentSource", "bonus"] }, 1, 0] },
                },
              },
            },
          ],
          sales: [
            { $match: paid },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                gross: { $sum: "$priceCents" },
                refunds: { $sum: { $ifNull: ["$refundedCents", 0] } },
                net: { $sum: net },
                last30: {
                  $sum: {
                    $cond: [{ $gte: ["$paymentConfirmedAt", since] }, net, 0],
                  },
                },
              },
            },
          ],
          statuses: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          payments: [
            { $match: paid },
            {
              $group: {
                _id: "$paymentSource",
                count: { $sum: 1 },
                amountCents: { $sum: net },
              },
            },
          ],
          platforms: [
            { $match: paid },
            {
              $group: {
                _id: "$platformLabel",
                count: { $sum: 1 },
                amountCents: { $sum: net },
              },
            },
          ],
          daily: [
            { $match: { ...paid, paymentConfirmedAt: { $gte: since } } },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$paymentConfirmedAt",
                    timezone: "UTC",
                  },
                },
                amountCents: { $sum: net },
              },
            },
            { $sort: { _id: 1 } },
          ],
          awaiting: [
            {
              $match: {
                paymentConfirmedAt: null,
                paymentSource: { $ne: "bonus" },
                status: "pending",
              },
            },
            { $count: "count" },
          ],
          manual: [
            {
              $match: {
                $or: [
                  { paymentConfirmedAt: { $ne: null } },
                  { paymentSource: "bonus" },
                ],
                supplierOrderId: null,
                status: { $in: ["pending", "processing"] },
                supplierStatus: { $nin: ["dispatching", "dispatch_unknown"] },
              },
            },
            { $count: "count" },
          ],
          uncertain: [
            {
              $match: {
                $or: [
                  {
                    supplierStatus: {
                      $in: [
                        "dispatching",
                        "dispatch_unknown",
                        "submission_error",
                      ],
                    },
                  },
                  { supplierActionPending: { $type: "string", $ne: "" } },
                ],
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]),
    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
          verified: {
            $sum: {
              $cond: [
                { $ne: [{ $ifNull: ["$emailVerified", null] }, null] },
                1,
                0,
              ],
            },
          },
          walletCents: { $sum: "$walletBalanceCents" },
          new30: { $sum: { $cond: [{ $gte: ["$createdAt", since] }, 1, 0] } },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { type: { $in: ["topup", "reward_credit"] } } },
      {
        $group: {
          _id: "$type",
          amountCents: { $sum: "$amountCents" },
          count: { $sum: 1 },
        },
      },
    ]),
    BankTransfer.aggregate([
      { $match: { confirmedAt: null } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amountCents: { $sum: "$amountCents" },
        },
      },
    ]),
    EmailOutbox.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Service.find({ active: true })
      .select(
        "platformId supplierServiceId defaultProvider providerMappings tiers.qtyValue tiers.defaultProvider tiers.providerMappings",
      )
      .lean(),
  ]);
  const orders = orderResults[0];
  const sales = orders.sales[0] || {
    count: 0,
    gross: 0,
    refunds: 0,
    net: 0,
    last30: 0,
  };
  const users = userResults[0] || {
    total: 0,
    admins: 0,
    verified: 0,
    walletCents: 0,
    new30: 0,
  };
  const { resolveProviderMapping, providerConfig } =
    await import("@/lib/supplier/providers");
  let unmappedPackages = 0;
  for (const service of serviceResults)
    for (const tier of service.tiers) {
      try {
        const route = resolveProviderMapping(service, tier.qtyValue);
        if (!route.serviceId || !providerConfig(route.provider).configured)
          unmappedPackages++;
      } catch {
        unmappedPackages++;
      }
    }
  return {
    orders: orders.summary[0] || { total: 0, guest: 0, bonuses: 0 },
    sales,
    users,
    statuses: orders.statuses as { _id: string; count: number }[],
    payments: orders.payments as {
      _id: string;
      count: number;
      amountCents: number;
    }[],
    platforms: orders.platforms as {
      _id: string;
      count: number;
      amountCents: number;
    }[],
    daily: (orders.daily as { _id: string; amountCents: number }[]).map(
      (row) => ({ date: row._id, amountCents: row.amountCents }),
    ),
    awaiting: orders.awaiting[0]?.count || 0,
    manual: orders.manual[0]?.count || 0,
    uncertain: orders.uncertain[0]?.count || 0,
    pendingBank: pendingBank[0] || { count: 0, amountCents: 0 },
    emails: emailResults as { _id: string; count: number }[],
    ledger: ledger as { _id: string; amountCents: number; count: number }[],
    services: { active: serviceResults.length, unmappedPackages },
  };
}

export function adminOrderRow(
  order: Omit<IOrder, "userId"> & { userId: unknown },
): AdminOrderRow {
  const user =
    order.userId && typeof order.userId === "object" && "email" in order.userId
      ? (order.userId as { _id?: unknown; name?: string; email?: string })
      : null;
  return {
    _id: String(order._id),
    platformId: order.platformId,
    platformLabel: order.platformLabel,
    category: order.category,
    qtyValue: order.qtyValue,
    targetLink: order.targetLink,
    serviceKind: order.serviceKind,
    postsCovered: order.postsCovered ?? null,
    pollOption: order.pollOption ?? null,
    comments: order.comments || [],
    priceCents: order.priceCents,
    refundedCents: order.refundedCents || 0,
    status: order.status,
    paymentSource: order.paymentSource,
    paymentConfirmedAt: order.paymentConfirmedAt?.toISOString() || null,
    customerEmail: order.customerEmail || order.guestEmail || user?.email || "",
    checkoutGroupId: order.checkoutGroupId,
    stripeSessionId: order.stripeSessionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    cryptoCheckoutId: order.cryptoCheckoutId,
    supplierOrderId: order.supplierOrderId,
    supplierProvider: order.supplierProvider,
    supplierRefillId: order.supplierRefillId,
    merchantRefill: order.merchantRefill,
    merchantRefillHistory: order.merchantRefillHistory || [],
    merchantRefillPolicy: Object.values(SUPPLIER_ROUTES).some(route => route.merchantRefill && route.provider === order.supplierProvider && route.id === order.supplierServiceIdUsed),
    supplierServiceIdUsed: order.supplierServiceIdUsed,
    supplierActionPending: order.supplierActionPending,
    supplierStatus: order.supplierStatus,
    failureReason: order.failureReason,
    createdAt: order.createdAt.toISOString(),
    userId: user ? { name: user.name, email: user.email } : null,
  };
}
export async function getAdminOrders(search: AdminSearch, userId?: string) {
  await dbConnect();
  const query: mongoose.QueryFilter<IOrder> = {};
  if (userId) query.userId = new mongoose.Types.ObjectId(userId);
  const q = searchValue(search, "q");
  if (q) {
    const regex = searchRegex(q);
    const userIds = await User.find({
      $or: [{ email: regex }, { name: regex }],
    }).distinct("_id");
    query.$or = [
      { customerEmail: regex },
      { guestEmail: regex },
      { targetLink: regex },
      { supplierOrderId: regex },
      { checkoutGroupId: regex },
      ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
      ...(mongoose.isValidObjectId(q)
        ? [{ _id: new mongoose.Types.ObjectId(q) }]
        : []),
    ];
  }
  const status = searchValue(search, "status");
  if (
    ["pending", "processing", "completed", "failed", "cancelled"].includes(
      status,
    )
  )
    query.status = status as IOrder["status"];
  const method = searchValue(search, "method");
  if (["card", "crypto", "wallet", "bank", "bonus"].includes(method))
    query.paymentSource = method as IOrder["paymentSource"];
  const provider = searchValue(search, "provider");
  if (["jap", "peakerr", "tiksta"].includes(provider))
    query.supplierProvider = provider as IOrder["supplierProvider"];
  const queue = searchValue(search, "queue");
  if (queue === "replacements") query["merchantRefill.status"] = "requested";
  if (queue === "manual") {
    query.supplierOrderId = null;
    query.status = { $in: ["pending", "processing"] };
    query.supplierStatus = { $nin: ["dispatching", "dispatch_unknown"] };
    query.$and = [
      {
        $or: [
          { paymentConfirmedAt: { $ne: null } },
          { paymentSource: "bonus" },
        ],
      },
    ];
  }
  if (queue === "attention")
    query.$and = [
      {
        $or: [
          {
            supplierStatus: {
              $in: ["dispatching", "dispatch_unknown", "submission_error"],
            },
          },
          { supplierActionPending: { $type: "string", $ne: "" } },
        ],
      },
    ];
  if (queue === "unpaid") {
    query.paymentConfirmedAt = null;
    query.paymentSource = { $ne: "bonus" };
    query.status = "pending";
  }
  const total = await Order.countDocuments(query);
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(pageNumber(search), pages);
  const orders = await Order.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * ADMIN_PAGE_SIZE)
    .limit(ADMIN_PAGE_SIZE)
    .populate("userId", "name email")
    .lean();
  return {
    rows: orders.map((order) => adminOrderRow(order as unknown as IOrder)),
    total,
    page,
    pages,
  };
}

export async function getAdminUsers(search: AdminSearch) {
  await dbConnect();
  const q = searchValue(search, "q");
  const role = searchValue(search, "role");
  const query = {
    ...(q && { $or: [{ name: searchRegex(q) }, { email: searchRegex(q) }] }),
    ...(role === "admin"
      ? { role: "admin" }
      : role === "customer"
        ? {
            $and: [
              { $or: [{ role: "customer" }, { role: { $exists: false } }] },
            ],
          }
        : {}),
  };
  const total = await User.countDocuments(query);
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(pageNumber(search), pages);
  const users = await User.find(query)
    .select(
      "name email role walletBalanceCents emailVerified provider createdAt",
    )
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * ADMIN_PAGE_SIZE)
    .limit(ADMIN_PAGE_SIZE)
    .lean();
  const activity = await Order.aggregate([
    { $match: { userId: { $in: users.map((user) => user._id) } } },
    {
      $group: {
        _id: "$userId",
        orders: { $sum: 1 },
        spentCents: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $ifNull: ["$paymentConfirmedAt", null] }, null] },
                  { $ne: ["$paymentSource", "bonus"] },
                ],
              },
              net,
              0,
            ],
          },
        },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
  ]);
  const byUser = new Map(activity.map((row) => [String(row._id), row]));
  return {
    rows: users.map((user) => {
      const stats = byUser.get(String(user._id));
      return {
        _id: String(user._id),
        name: user.name || "Unnamed account",
        email: user.email,
        role: user.role || "customer",
        walletBalanceCents: user.walletBalanceCents || 0,
        emailVerified: Boolean(user.emailVerified),
        provider: user.provider || "not recorded",
        createdAt: user.createdAt?.toISOString() || null,
        orderCount: stats?.orders || 0,
        spentCents: stats?.spentCents || 0,
        lastOrderAt: stats?.lastOrderAt?.toISOString() || null,
      };
    }),
    total,
    page,
    pages,
  };
}
