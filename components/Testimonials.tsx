"use client";

import Image from "next/image";
import { Star, Quote, BadgeCheck } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TESTIMONIALS = [
  {
    name: "Amira K.",
    role: "Content Creator",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    quote:
      "I was skeptical at first but the delivery was fast and my engagement actually improved. Support answered my questions within minutes.",
    purchased: "2,500 Instagram Followers",
    time: "2 weeks ago",
  },
  {
    name: "Daniel R.",
    role: "Small Business Owner",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    quote:
      "Used this for my shop's Instagram before a launch. Smooth checkout, no password needed, and the followers started coming in right away.",
    purchased: "1,000 Instagram Followers",
    time: "1 month ago",
  },
  {
    name: "Priya S.",
    role: "TikTok Creator",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80",
    quote:
      "Best value I've found for TikTok growth services. The drip-feed option made everything look natural. Will be ordering again.",
    purchased: "5,000 TikTok Followers",
    time: "3 weeks ago",
  },
  {
    name: "Marcus T.",
    role: "Wedding Photographer",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
    quote:
      "Needed a quick boost before a big showcase post. Delivery started within the hour and everything looked completely natural.",
    purchased: "2,500 Instagram Likes",
    time: "5 days ago",
  },
  {
    name: "Sofia L.",
    role: "Salon Owner",
    photo: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=120&h=120&q=80",
    quote:
      "Support walked me through everything since it was my first time. The wallet discount makes reordering every month a no-brainer.",
    purchased: "1,000 Facebook Followers",
    time: "1 week ago",
  },
  {
    name: "Jake M.",
    role: "Automotive Detailer",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80",
    quote:
      "Refill guarantee actually means something here — had a small drop after two weeks and they topped it right back up, no questions asked.",
    purchased: "500 TikTok Likes",
    time: "2 months ago",
  },
];

const AVATAR_RINGS = ["ring-warm-amber/60", "ring-warm-rose/60", "ring-warm-mint/60", "ring-warm-lilac/60"];

export default function Testimonials() {
  return (
    <section id="reviews" className="border-y border-border bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Loved by creators everywhere
          </h2>
          <p className="mt-4 text-muted-foreground">
            Don&apos;t just take our word for it — here&apos;s what our customers say.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full border-border bg-card p-6">
                <div className="flex items-start justify-between">
                  <Quote className="h-6 w-6 text-brand-500" />
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <motion.span
                        key={starIndex}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.2, delay: (i % 3) * 0.05 + starIndex * 0.06 }}
                      >
                        <Star className="h-3.5 w-3.5 fill-accent-500 text-brand-600" />
                      </motion.span>
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <Badge variant="completed" className="mt-4 rounded-full font-normal">
                  Purchased {t.purchased}
                </Badge>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ${AVATAR_RINGS[i % AVATAR_RINGS.length]}`}
                    >
                      <Image src={t.photo} alt={t.name} fill sizes="36px" className="object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        {t.name}
                        <BadgeCheck className="h-3.5 w-3.5 text-brand-600" />
                      </div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground/60">{t.time}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
