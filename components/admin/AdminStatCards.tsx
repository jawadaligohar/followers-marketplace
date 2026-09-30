import { Card, CardContent } from "@/components/ui/card";

export default function AdminStatCards({
  totalOrders,
  totalUsers,
  totalRevenueCents,
}: {
  totalOrders: number;
  totalUsers: number;
  totalRevenueCents: number;
}) {
  const stats = [
    { label: "Total orders", value: totalOrders.toLocaleString() },
    { label: "Total users", value: totalUsers.toLocaleString() },
    { label: "Revenue", value: `$${(totalRevenueCents / 100).toFixed(2)}` },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="border-white/10 bg-white/[0.03]">
          <CardContent>
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-3xl font-extrabold text-gradient">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
