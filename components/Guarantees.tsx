"use client";

import { motion } from "motion/react";
import { ShieldCheck, Sparkles, LifeBuoy } from "lucide-react";
import { Card } from "@/components/ui/card";

const GUARANTEES = [
  {
    icon: Sparkles,
    title: "Uncompromising Quality",
    description: "We despise bots as much as you do. Every interaction is sourced from our premium network and paced naturally to keep your profile's engagement looking flawlessly authentic.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: ShieldCheck,
    title: "Ironclad Security",
    description: "We will never ask for your password. Our delivery methods operate entirely externally, ensuring your account stays 100% compliant with platform guidelines and completely safe from bans.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: LifeBuoy,
    title: "We've Got Your Back, 24/7",
    description: "No endless chatbots or waiting days for a generic email reply. Our dedicated team is here around the clock to track your orders, answer questions, and resolve any hiccups instantly.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

export default function Guarantees() {
  return (
    <section className="relative overflow-hidden bg-zinc-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
          >
            The Surgeon Promises
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-zinc-600"
          >
            Quality, security, and elite support aren't just buzzwords for us—they are built into the DNA of every single order.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
          {GUARANTEES.map((guarantee, i) => (
            <motion.div
              key={guarantee.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="relative"
            >
              <Card className="h-full border-none bg-white p-8 shadow-xl shadow-zinc-200/50 transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-200/60">
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${guarantee.bgColor}`}>
                  <guarantee.icon className={`h-7 w-7 ${guarantee.color}`} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-zinc-900">
                  {guarantee.title}
                </h3>
                <p className="text-base leading-relaxed text-zinc-600">
                  {guarantee.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
