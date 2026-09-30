import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import OrderHistoryTable, { OrderRow } from "@/components/dashboard/OrderHistoryTable";
import FadeIn from "@/components/shared/FadeIn";

export const metadata = { title: "Orders | Surgeon" };

export default async function OrdersPage() {
  const session = await auth();
  await dbConnect();

  const orders = await Order.find({ userId: session!.user.id }).sort({ createdAt: -1 }).lean();

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
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold">Order history</h1>
      </FadeIn>
      <FadeIn delay={0.05}>
        <OrderHistoryTable orders={orderRows} />
      </FadeIn>
    </div>
  );
}
