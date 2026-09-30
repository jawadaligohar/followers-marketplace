"use client";

import { MousePointerClick, CreditCard, Rocket } from "lucide-react";
import { motion } from "motion/react";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Choose Your Service",
    desc: "Select a platform, pick a service, and enter your profile or post link.",
  },
  {
    icon: CreditCard,
    title: "Secure Checkout",
    desc: "Pay safely with card, PayPal or crypto. No password or account access ever required.",
  },
  {
    icon: Rocket,
    title: "Watch It Grow",
    desc: "Your order starts processing instantly and completes within minutes to hours.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-white/10 bg-white/[0.02] py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-white/60">
            Three simple steps to grow your social presence — no hassle, no
            waiting around.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-600/30">
                <step.icon className="h-7 w-7 text-white" />
              </div>
              <div className="mx-auto mt-4 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-background text-xs font-bold text-white/60">
                {i + 1}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
