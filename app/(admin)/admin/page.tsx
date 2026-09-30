import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { User } from "@/lib/db/models/User";
import AdminStatCards from "@/components/admin/AdminStatCards";
import FadeIn from "@/components/shared/FadeIn";

export const metadata = { title: "Admin | Surgeon" };

export default async function AdminOverviewPage() {
  await dbConnect();

  const [totalOrders, totalUsers, orders] = await Promise.all([
    Order.countDocuments({}),
    User.countDocuments({}),
    Order.find({ status: { $in: ["processing", "completed"] } }).select("priceCents").lean(),
  ]);

  const totalRevenueCents = orders.reduce((sum, o) => sum + o.priceCents, 0);

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-2xl font-bold">Admin overview</h1>
      </FadeIn>
      <FadeIn delay={0.05}>
        <AdminStatCards
          totalOrders={totalOrders}
          totalUsers={totalUsers}
          totalRevenueCents={totalRevenueCents}
        />
      </FadeIn>
    </div>
  );
}
