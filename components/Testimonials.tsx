"use client";

import { Star, Quote } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    name: "Amira K.",
    role: "Content Creator",
    quote:
      "I was skeptical at first but the delivery was fast and my engagement actually improved. Support answered my questions within minutes.",
  },
  {
    name: "Daniel R.",
    role: "Small Business Owner",
    quote:
      "Used this for my shop's Instagram before a launch. Smooth checkout, no password needed, and the followers started coming in right away.",
  },
  {
    name: "Priya S.",
    role: "TikTok Creator",
    quote:
      "Best value I've found for TikTok growth services. The drip-feed option made everything look natural. Will be ordering again.",
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="border-y border-white/10 bg-white/[0.02] py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Loved by creators everywhere
          </h2>
          <p className="mt-4 text-white/60">
            Don&apos;t just take our word for it — here&apos;s what our customers say.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-white/10 bg-white/[0.03] p-6">
                <Quote className="h-6 w-6 text-brand-500" />
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <motion.span
                        key={starIndex}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.2, delay: i * 0.05 + starIndex * 0.06 }}
                      >
                        <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
                      </motion.span>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
