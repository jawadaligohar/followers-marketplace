import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import OrdersTable, { AdminOrderRow } from "@/components/admin/OrdersTable";
import SupplierStatusBanner from "@/components/admin/SupplierStatusBanner";
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
    targetLink: o.targetLink,
    postsCovered: o.postsCovered ?? null,
    pollOption: o.pollOption ?? null,
    comments: o.comments ?? [],
    priceCents: o.priceCents,
    status: o.status,
    paymentSource: o.paymentSource,
    supplierOrderId: o.supplierOrderId ?? null,
    supplierProvider: o.supplierProvider || null,
    supplierRefillId: o.supplierRefillId || null,
    platformId: o.platformId,
    supplierStatus: o.supplierStatus ?? null,
    failureReason: o.failureReason ?? null,
    createdAt: o.createdAt
      ? new Date(o.createdAt).toISOString()
      : new Date().toISOString(),
    userId: o.userId as unknown as { name?: string; email?: string },
  }));

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">All orders</h1>
          <SupplierStatusBanner />
        </div>
      </FadeIn>
      <FadeIn delay={0.05}>
        <OrdersTable orders={rows} />
      </FadeIn>
    </div>
  );
}
