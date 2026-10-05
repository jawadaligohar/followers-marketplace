import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import OrdersTable, { AdminOrderRow } from "@/components/admin/OrdersTable";
import FadeIn from "@/components/shared/FadeIn";

export const metadata = { title: "Orders | Surgeon Admin" };

export default async function AdminOrdersPage() {
  await dbConnect();
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .populate("userId", "name email")
    .lean();

  const rows: AdminOrderRow[] = orders.map((o) => ({
    _id: o._id.toString(),
    platformLabel: o.platformLabel,
    category: o.category,
    qtyValue: o.qtyValue,
    priceCents: o.priceCents,
    status: o.status,
    paymentSource: o.paymentSource,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
    userId: o.userId as unknown as { name?: string; email?: string },
  }));

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold">All orders</h1>
      </FadeIn>
      <FadeIn delay={0.05}>
        <OrdersTable orders={rows} />
      </FadeIn>
    </div>
  );
}
