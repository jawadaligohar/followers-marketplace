import { requireAdminPage } from "@/lib/adminGuard";
import Link from "next/link";
import { getAdminMetrics, getAdminOrders } from "@/lib/adminQueries";
import AdminStatCards from "@/components/admin/AdminStatCards";
import OrdersTable from "@/components/admin/OrdersTable";
import SupplierStatusBanner from "@/components/admin/SupplierStatusBanner";
import RevenueChart from "@/components/admin/RevenueChart";
import { Card } from "@/components/ui/card";
export const metadata = { title: "Admin | Surgeon" };
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export default async function AdminOverviewPage() {
  await requireAdminPage();
  const [metrics, recent] = await Promise.all([
    getAdminMetrics(),
    getAdminOrders({}),
  ]);
  const pendingEmails =
    metrics.emails.find((row) => row._id === "pending")?.count || 0;
  const topups =
    metrics.ledger.find((row) => row._id === "topup")?.amountCents || 0;
  const rewards =
    metrics.ledger.find((row) => row._id === "reward_credit")?.amountCents || 0;
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live order, customer, payment and fulfillment activity. Sales require
          confirmed payment; changing order status does not recognize revenue.
        </p>
      </div>
      <AdminStatCards
        stats={[
          {
            label: "Net paid order sales · lifetime",
            value: metrics.sales.net,
            money: true,
            href: "/admin/orders",
          },
          {
            label: "Net paid order sales · last 30 UTC days",
            value: metrics.sales.last30,
            money: true,
          },
          {
            label: "Confirmed paid orders",
            value: metrics.sales.count,
            href: "/admin/orders",
          },
          {
            label: "Average paid order · net",
            value: metrics.sales.count
              ? Math.round(metrics.sales.net / metrics.sales.count)
              : 0,
            money: true,
          },
          {
            label: "All orders · includes bonuses",
            value: metrics.orders.total,
            href: "/admin/orders",
          },
          {
            label: "Registered users",
            value: metrics.users.total,
            href: "/admin/users",
          },
          {
            label: "New users · last 30 UTC days",
            value: metrics.users.new30,
            href: "/admin/users",
          },
          {
            label: "Refunded order value",
            value: metrics.sales.refunds,
            money: true,
            href: "/admin/benefits",
          },
          {
            label: "Customer wallet balances",
            value: metrics.users.walletCents,
            money: true,
            href: "/admin/transactions",
          },
          {
            label: "Confirmed wallet top-ups",
            value: topups,
            money: true,
            href: "/admin/transactions?type=topup",
          },
          {
            label: "Rewards credited to wallets",
            value: rewards,
            money: true,
            href: "/admin/transactions?type=reward_credit",
          },
          {
            label: "Guest orders",
            value: metrics.orders.guest,
            href: "/admin/orders",
          },
        ]}
      />
      <section
        aria-label="Processing alerts"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {[
          {
            label: "Paid orders waiting for staff",
            value: metrics.manual,
            href: "/admin/orders?queue=manual",
          },
          {
            label: "Provider submissions/actions need review",
            value: metrics.uncertain,
            href: "/admin/orders?queue=attention",
          },
          {
            label: "Awaiting payment",
            value: metrics.awaiting,
            href: "/admin/orders?queue=unpaid",
          },
          {
            label: `Pending bank transfers · ${dollars(metrics.pendingBank.amountCents)}`,
            value: metrics.pendingBank.count,
            href: "/admin/benefits",
          },
          {
            label: "Queued transactional emails",
            value: pendingEmails,
            href: "/admin/emails?status=pending",
          },
          {
            label: "Packages needing supplier setup",
            value: metrics.services.unmappedPackages,
            href: "/admin/services",
          },
        ].map((alert) => (
          <Link
            key={alert.label}
            href={alert.href}
            className={`rounded-xl border p-4 ${alert.value ? "border-amber-500/40 bg-amber-500/5" : "border-border"}`}
          >
            <span className="text-2xl font-bold">{alert.value}</span>
            <p className="mt-1 text-xs text-muted-foreground">{alert.label}</p>
          </Link>
        ))}
      </section>
      <SupplierStatusBanner />
      <div className="grid gap-5 xl:grid-cols-3">
        <RevenueChart data={metrics.daily} />
        <Card className="p-5">
          <h2 className="font-semibold">Order status</h2>
          {metrics.statuses.map((row) => (
            <Link
              key={row._id}
              href={`/admin/orders?status=${row._id}`}
              className="flex justify-between border-b border-border py-3 text-sm capitalize"
            >
              <span>{row._id}</span>
              <strong>{row.count}</strong>
            </Link>
          ))}
          <p className="mt-3 text-xs text-muted-foreground">
            {metrics.orders.bonuses} bonus orders · {metrics.services.active}{" "}
            active services · {metrics.users.verified} verified users
          </p>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[
          { title: "Payment methods · net paid sales", rows: metrics.payments },
          { title: "Platforms · net paid sales", rows: metrics.platforms },
        ].map((group) => (
          <Card key={group.title} className="p-5">
            <h2 className="font-semibold">{group.title}</h2>
            {group.rows.length ? (
              group.rows.map((row) => (
                <div
                  key={row._id}
                  className="flex justify-between border-b border-border py-3 text-sm"
                >
                  <span className="capitalize">
                    {row._id}{" "}
                    <span className="text-muted-foreground">
                      ({row.count} orders)
                    </span>
                  </span>
                  <strong>{dollars(row.amountCents)}</strong>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No confirmed paid orders yet.
              </p>
            )}
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Sales include wallet-paid orders, exclude free bonuses, and subtract
        recorded refunds. Wallet top-ups are shown separately and are not
        counted again as order sales. Supplier cost, processor fees and profit
        are not reported because those amounts are not recorded. Legacy payments
        without confirmation timestamps are excluded.
      </p>
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Recent orders</h2>
        <Link
          href="/admin/orders"
          className="text-sm text-brand-600 hover:underline"
        >
          View all
        </Link>
      </div>
      <OrdersTable orders={recent.rows.slice(0, 5)} />
    </div>
  );
}
