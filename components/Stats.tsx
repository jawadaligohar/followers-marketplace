"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";

const STATS = [
  { value: "250K+", label: "Happy Customers" },
  { value: "5M+", label: "Orders Delivered" },
  { value: "4.9/5", label: "Average Rating" },
  { value: "24/7", label: "Support Available" },
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
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold text-gradient sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </Card>
      </motion.div>
    </section>
  );
}
