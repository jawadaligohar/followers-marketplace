import Link from "next/link";
import { Card } from "@/components/ui/card";
export default function AdminStatCards({
  stats,
}: {
  stats: { label: string; value: number; money?: boolean; href?: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="gap-2 p-5">
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className="text-2xl font-bold">
            {stat.money
              ? `$${(stat.value / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : stat.value.toLocaleString("en-US")}
          </p>
          {stat.href && (
            <Link
              href={stat.href}
              className="text-xs text-brand-600 hover:underline"
            >
              View details →
            </Link>
          )}
        </Card>
      ))}
    </div>
  );
}
