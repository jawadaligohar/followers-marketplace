import Link from "next/link";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { User } from "@/lib/db/models/User";
import { Order } from "@/lib/db/models/Order";
import { dbConnect } from "@/lib/db/connect";
import { getAdminOrders, type AdminSearch } from "@/lib/adminQueries";
import { adminTransactions } from "@/lib/adminActivity";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminStatCards from "@/components/admin/AdminStatCards";
import OrdersTable from "@/components/admin/OrdersTable";
import WalletLedger from "@/components/admin/WalletLedger";
import { formatDateTime } from "@/lib/format";
export const metadata = { title: "User account | Surgeon Admin" };
export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<AdminSearch>;
}) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  await dbConnect();
  const user = await User.findById(id)
    .select(
      "name email role emailVerified provider createdAt walletBalanceCents",
    )
    .lean();
  if (!user) notFound();
  const search = await searchParams;
  const [orders, ledger, totals] = await Promise.all([
    getAdminOrders(search, id),
    adminTransactions({}, id),
    Order.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(id),
          paymentConfirmedAt: { $ne: null },
          paymentSource: { $ne: "bonus" },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          grossCents: { $sum: "$priceCents" },
          refundedCents: { $sum: { $ifNull: ["$refundedCents", 0] } },
        },
      },
    ]),
  ]);
  const paid = totals[0] || { grossCents: 0, refundedCents: 0, count: 0 };
  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="text-sm text-brand-600 hover:underline"
      >
        ← All users
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <p>{user.email}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.role || "customer"} ·{" "}
          {user.provider || "Login provider not recorded"} ·{" "}
          {user.emailVerified ? "Verified email" : "Email unverified"} · Joined{" "}
          {user.createdAt
            ? formatDateTime(user.createdAt.toISOString()).date
            : "not recorded"}
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{id}</p>
      </div>
      <AdminStatCards
        stats={[
          {
            label: "Wallet balance",
            value: user.walletBalanceCents || 0,
            money: true,
          },
          { label: "Confirmed paid orders", value: paid.count },
          {
            label: "Net paid spend",
            value: Math.max(0, paid.grossCents - paid.refundedCents),
            money: true,
          },
          { label: "Recorded refunds", value: paid.refundedCents, money: true },
        ]}
      />
      <div className="flex flex-wrap gap-4 text-sm text-brand-600">
        <Link href={`/admin/users?q=${encodeURIComponent(user.email)}`}>
          Manage role / wallet
        </Link>
        <Link href={`/admin/emails?q=${encodeURIComponent(user.email)}`}>
          Customer email activity
        </Link>
        <Link href={`/admin/transactions?user=${id}`}>Full wallet history</Link>
      </div>
      <h2 className="text-lg font-semibold">Order history</h2>
      <OrdersTable key={orders.page} orders={orders.rows} />
      <AdminPagination
        base={`/admin/users/${id}`}
        search={search}
        {...orders}
      />
      <h2 className="text-lg font-semibold">Recent wallet entries</h2>
      <WalletLedger rows={ledger.rows.slice(0, 10)} />
    </div>
  );
}
