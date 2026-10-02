import Link from "next/link";
import { PlusCircle, ListOrdered, ShieldCheck, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import WalletBalanceCard from "@/components/dashboard/WalletBalanceCard";
import OrderHistoryTable, { OrderRow } from "@/components/dashboard/OrderHistoryTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/shared/FadeIn";

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
      <FadeIn className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back{session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your account.</p>
        </div>
        <Button variant="default" render={<Link href="/dashboard/orders/new" />} nativeButton={false} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          New Order
        </Button>
      </FadeIn>

      <FadeIn delay={0.05} className="grid gap-6 sm:grid-cols-3">
        <WalletBalanceCard walletBalanceCents={session!.user.walletBalanceCents} />
        <Card className="border-border bg-card">
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted">
                <ListOrdered className="h-4 w-4 text-brand-600" />
              </span>
              Total orders
            </div>
            <div className="mt-4 text-3xl font-extrabold text-gradient">{orders.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted">
                {session?.user.role === "admin" ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                ) : (
                  <User className="h-4 w-4 text-emerald-600" />
                )}
              </span>
              Account role
            </div>
            <div className="mt-4 text-lg font-semibold capitalize">{session?.user.role}</div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <OrderHistoryTable orders={orderRows} />
      </FadeIn>
    </div>
  );
}
