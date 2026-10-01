"use client";

import { motion } from "motion/react";
import { ListOrdered, Users, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CountUp from "@/components/CountUp";

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
    {
      label: "Total orders",
      value: totalOrders,
      decimals: 0,
      prefix: "",
      icon: ListOrdered,
      accent: "from-brand-50 to-transparent",
      iconColor: "text-brand-600",
    },
    {
      label: "Total users",
      value: totalUsers,
      decimals: 0,
      prefix: "",
      icon: Users,
      accent: "from-warm-lilac/15 to-transparent",
      iconColor: "text-brand-600",
    },
    {
      label: "Revenue",
      value: totalRevenueCents / 100,
      decimals: 2,
      prefix: "$",
      icon: DollarSign,
      accent: "from-warm-mint/15 to-transparent",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          whileHover={{ y: -3 }}
        >
          <Card className={`relative overflow-hidden border-border bg-gradient-to-br ${s.accent} bg-card`}>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted">
                  <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                </span>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-gradient">
                {s.prefix}
                <CountUp value={s.value} decimals={s.decimals} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
