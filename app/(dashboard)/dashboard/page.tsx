import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import WalletBalanceCard from "@/components/dashboard/WalletBalanceCard";
import OrderHistoryTable, { OrderRow } from "@/components/dashboard/OrderHistoryTable";

export const metadata = { title: "Dashboard | Surgeon" };

export default async function DashboardOverviewPage() {
  const session = await auth();
  await dbConnect();

  const orders = await Order.find({ userId: session!.user.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const orderRows: OrderRow[] = orders.map((o) => ({
    _id: o._id.toString(),
    platformLabel: o.platformLabel,
    category: o.category,
    qtyValue: o.qtyValue,
    priceCents: o.priceCents,
    status: o.status,
    paymentSource: o.paymentSource,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back{session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-sm text-white/50">Here&apos;s what&apos;s happening with your account.</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:opacity-90"
        >
          <PlusCircle className="h-4 w-4" />
          New Order
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <WalletBalanceCard walletBalanceCents={session!.user.walletBalanceCents} />
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm text-white/50">Total orders</div>
          <div className="mt-2 text-3xl font-extrabold">{orders.length > 0 ? orders.length : 0}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm text-white/50">Account role</div>
          <div className="mt-2 text-lg font-semibold capitalize">{session?.user.role}</div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-accent-500 hover:underline">
            View all
          </Link>
        </div>
        <OrderHistoryTable orders={orderRows} />
      </div>
    </div>
  );
}
