"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RevenueChart({
  data,
}: {
  data: { date: string; amountCents: number }[];
}) {
  // Process data to fill in missing days for the last 30 days
  const chartData = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (29 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const found = data.find((x) => x.date === dateStr);
    return {
      date: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        timeZone: "UTC",
      }).format(d),
      revenue: found ? found.amountCents / 100 : 0,
    };
  });

  return (
    <Card className="col-span-full xl:col-span-2 border-border bg-card">
      <CardHeader>
        <CardTitle>Net paid order sales · last 30 UTC days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickMargin={10}
                minTickGap={30}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value) => [
                  `$${Number(value ?? 0).toFixed(2)}`,
                  "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
