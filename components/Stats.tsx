"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import CountUp from "./CountUp";

const STATS = [
  { value: 250, suffix: "K+", label: "Happy Customers" },
  { value: 5, suffix: "M+", label: "Orders Delivered" },
  { value: 4.9, suffix: "/5", label: "Average Rating", decimals: 1 },
  { value: 24, suffix: "/7", label: "Support Available" },
];

export default function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4 }}
      >
        <Card className="grid grid-cols-2 gap-8 border-white/10 bg-white/[0.03] p-10 sm:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="text-3xl font-extrabold text-gradient sm:text-4xl">
                <CountUp value={stat.value} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </Card>
      </motion.div>
    </section>
  );
}
