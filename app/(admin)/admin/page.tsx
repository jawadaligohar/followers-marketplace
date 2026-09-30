import Link from "next/link";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { User } from "@/lib/db/models/User";
import AdminStatCards from "@/components/admin/AdminStatCards";
import OrdersTable, { AdminOrderRow } from "@/components/admin/OrdersTable";
import FadeIn from "@/components/shared/FadeIn";

export const metadata = { title: "Admin | Surgeon" };

export default async function AdminOverviewPage() {
  await dbConnect();

  const [totalOrders, totalUsers, orders, recentOrders] = await Promise.all([
    Order.countDocuments({}),
    User.countDocuments({}),
    Order.find({ status: { $in: ["processing", "completed"] } }).select("priceCents").lean(),
    Order.find({}).sort({ createdAt: -1 }).limit(5).populate("userId", "name email").lean(),
  ]);

  const totalRevenueCents = orders.reduce((sum, o) => sum + o.priceCents, 0);

  const recentRows: AdminOrderRow[] = recentOrders.map((o) => ({
    _id: o._id.toString(),
    platformLabel: o.platformLabel,
    category: o.category,
    qtyValue: o.qtyValue,
    priceCents: o.priceCents,
    status: o.status,
    paymentSource: o.paymentSource,
    createdAt: o.createdAt.toISOString(),
    userId: o.userId as unknown as { name?: string; email?: string },
  }));

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-2xl font-bold">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A snapshot of how Surgeon is performing right now.
        </p>
      </FadeIn>
      <FadeIn delay={0.05}>
        <AdminStatCards
          totalOrders={totalOrders}
          totalUsers={totalUsers}
          totalRevenueCents={totalRevenueCents}
        />
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-accent-500 hover:underline">
            View all
          </Link>
        </div>
        <OrdersTable orders={recentRows} />
      </FadeIn>
    </div>
  );
}
