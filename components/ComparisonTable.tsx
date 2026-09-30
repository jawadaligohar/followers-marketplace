"use client";

import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";

const ROWS = [
  { label: "Profiles with bios, photos & posts", us: true, bots: false },
  { label: "Gradual, natural-looking delivery", us: true, bots: false },
  { label: "30-day refill guarantee", us: true, bots: false },
  { label: "No password required, ever", us: true, bots: true },
  { label: "24/7 human support", us: true, bots: false },
  { label: "Risk of account flags", us: false, bots: true },
];

export default function ComparisonTable() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Real engagement, side by side
        </h2>
        <p className="mt-4 text-white/60">
          Not all growth services are built the same. Here&apos;s how Surgeon
          compares to typical bot-driven providers.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4 }}
        className="mt-12"
      >
        <Card className="overflow-hidden border-white/10 bg-white/[0.03] p-0">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-white/10 px-6 py-4 text-sm font-semibold sm:gap-x-8">
            <span className="text-white/40">Feature</span>
            <span className="text-center text-gradient">Surgeon</span>
            <span className="text-center text-white/40">Bot Services</span>
          </div>
          {ROWS.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-white/5 px-6 py-3.5 text-sm last:border-0 sm:gap-x-8"
            >
              <span className="text-white/70">{row.label}</span>
              <span className="flex justify-center">
                {row.us ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <X className="h-4 w-4 text-white/20" />
                )}
              </span>
              <span className="flex justify-center">
                {row.bots ? (
                  <Check className="h-4 w-4 text-white/40" />
                ) : (
                  <X className="h-4 w-4 text-red-400/70" />
                )}
              </span>
            </motion.div>
          ))}
        </Card>
      </motion.div>
    </section>
  );
}
