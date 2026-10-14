"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { PLATFORM_STYLES } from "@/components/shared/PlatformIcon";
import { PLATFORM_ORDER, PLATFORMS } from "@/lib/catalog";
import { useServices } from "@/lib/cart/useServices";
import { centsToUsd } from "@/lib/pricing";

const BLURBS: Record<string, { bg: string; desc: string }> = {
  instagram: {
    bg: "bg-pink-50/50 hover:bg-pink-50",
    desc: "Followers, likes, views, Reel views, comments and auto likes on every new post.",
  },
  tiktok: {
    bg: "bg-slate-50/50 hover:bg-slate-50",
    desc: "Followers, likes, views, comments, LIVE viewers and auto engagement to reach the For You page.",
  },
  facebook: {
    bg: "bg-blue-50/50 hover:bg-blue-50",
    desc: "Page likes, followers, post likes and video views to strengthen your brand presence.",
  },
  twitter: {
    bg: "bg-zinc-50/50 hover:bg-zinc-50",
    desc: "Followers, likes, retweets, views, poll votes and Space listeners to amplify your voice.",
  },
};

const SERVICES = PLATFORM_ORDER.map((id) => ({
  id,
  icon: PLATFORM_STYLES[id].icon,
  color: PLATFORM_STYLES[id].color,
  badge: PLATFORM_STYLES[id].badge,
  bg: BLURBS[id].bg,
  name: `${PLATFORMS[id].label} Growth`,
  desc: BLURBS[id].desc,
}));

export default function Services() {
  const { services, loaded } = useServices();
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Where your community lives
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          From photo feeds to short-form video, we make it simple to find your people on any app.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((service, i) => {
          const available = services.filter((s) => s.platformId === service.id);
          const prices = available.flatMap((s) => s.tiers.map((tier) => tier.priceCents));
          return (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="group relative"
          >
            <Card className={`h-full border-none p-8 transition-colors ${service.bg} shadow-none`}>
              <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${service.badge} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                <service.icon className={`h-6 w-6 ${service.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground">{service.name}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{service.desc}</p>
              
              <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {available.length} services{loaded && prices.length > 0 && <> &middot; from <span className="text-foreground">${centsToUsd(Math.min(...prices))}</span></>}
                </span>
                <Link
                  href={`/services#${service.id}`}
                  className={`text-sm font-bold ${service.color}`}
                >
                  Explore →
                </Link>
              </div>
            </Card>
          </motion.div>
          );
        })}
      </div>
    </section>
  );
}
