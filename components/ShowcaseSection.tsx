"use client";

import { motion } from "motion/react";
import { Zap, TrendingUp, Users } from "lucide-react";
import HeroMockup from "./HeroMockup";

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: "Fast start window",
    desc: "Most orders begin processing within minutes of checkout, not hours.",
  },
  {
    icon: TrendingUp,
    title: "Natural-looking growth",
    desc: "Drip-feed delivery paces your order so it never looks artificial.",
  },
  {
    icon: Users,
    title: "Real, active accounts",
    desc: "Every order draws from real profiles, not throwaway bot accounts.",
  },
];

export default function ShowcaseSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <HeroMockup />

        <div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            See your community{" "}
            <span className="text-gradient">come to life</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            We don't just send numbers; we help you build a presence you're proud of. Watch your audience grow naturally, with full transparency every step of the way.
          </p>

          <div className="mt-8 space-y-5">
            {HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-50">
                  <h.icon className="h-4.5 w-4.5 text-brand-500" />
                </span>
                <div>
                  <div className="font-semibold">{h.title}</div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{h.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
