"use client";

import { motion } from "motion/react";
import { Check, Loader2, TrendingUp } from "lucide-react";
import { FaInstagram } from "react-icons/fa6";

const STEPS = [
  {
    number: "01",
    title: "Choose your service",
    desc: "Select a platform, pick a service, and enter your profile or post link. No account access required — ever.",
    visual: "pick",
  },
  {
    number: "02",
    title: "Secure checkout",
    desc: "Pay safely with card, PayPal or crypto in seconds. Your payment is the only thing we ever touch.",
    visual: "pay",
  },
  {
    number: "03",
    title: "Watch it grow",
    desc: "Delivery starts within minutes and paces itself naturally so your growth always looks organic.",
    visual: "grow",
  },
];

function StepVisual({ type }: { type: string }) {
  if (type === "pick") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-orange-400">
          <FaInstagram className="h-4 w-4 text-white" />
        </span>
        <div className="flex-1">
          <div className="h-2 w-24 rounded-full bg-muted" />
          <div className="mt-1.5 h-2 w-16 rounded-full bg-muted" />
        </div>
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-500"
        >
          <span className="h-2 w-2 rounded-full bg-brand-500" />
        </motion.span>
      </div>
    );
  }

  if (type === "pay") {
    return (
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-8 rounded bg-gradient-to-br from-brand-500 to-accent-500" />
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" />
          Payment confirmed
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-end gap-1 h-10">
        {[40, 55, 45, 70, 85, 95].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.06 }}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-500 to-accent-500"
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-600">
        <TrendingUp className="h-3.5 w-3.5" />
        Growing steadily
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-muted/40 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-xl">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            How it works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mt-4 text-muted-foreground"
          >
            Three simple steps to grow your social presence — no hassle, no
            waiting around.
          </motion.p>
        </div>

        <div className="relative mt-16 space-y-14">
          <div className="absolute left-[27px] top-4 bottom-4 hidden w-px bg-gradient-to-b from-brand-500/40 via-border to-transparent sm:block" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative grid gap-6 sm:grid-cols-[auto_1fr_260px] sm:items-center sm:pl-0"
            >
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-lg font-extrabold text-gradient">
                {step.number}
              </span>

              <div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{step.desc}</p>
              </div>

              <div className="sm:w-[260px]">
                <StepVisual type={step.visual} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
