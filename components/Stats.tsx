"use client";

import { motion } from "motion/react";
import { Users, PackageCheck, Star, Headset } from "lucide-react";
import CountUp from "./CountUp";

const STATS = [
  { value: 250, suffix: "K+", label: "Happy Customers", icon: Users },
  { value: 5, suffix: "M+", label: "Orders Delivered", icon: PackageCheck },
  { value: 4.9, suffix: "/5", label: "Average Rating", decimals: 1, icon: Star },
  { value: 24, suffix: "/7", label: "Support Available", icon: Headset },
];

export default function Stats() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-white/[0.02] py-14">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 sm:grid-cols-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, delay: i * 0.1 }}
            className="flex items-center gap-4"
          >
            <motion.span
              whileHover={{ rotate: -6, scale: 1.05 }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/15 to-accent-500/10"
            >
              <stat.icon className="h-5 w-5 text-accent-500" />
            </motion.span>
            <div>
              <div className="text-2xl font-extrabold text-gradient sm:text-3xl">
                <CountUp value={stat.value} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
