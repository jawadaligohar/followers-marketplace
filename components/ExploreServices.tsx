"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaFacebook,
} from "react-icons/fa6";

const SERVICES = [
  { platform: "Instagram", label: "Followers", icon: FaInstagram, color: "text-pink-500" },
  { platform: "Instagram", label: "Likes", icon: FaInstagram, color: "text-pink-500" },
  { platform: "Instagram", label: "Views", icon: FaInstagram, color: "text-pink-500" },
  { platform: "TikTok", label: "Followers", icon: FaTiktok, color: "text-white" },
  { platform: "TikTok", label: "Likes", icon: FaTiktok, color: "text-white" },
  { platform: "TikTok", label: "Views", icon: FaTiktok, color: "text-white" },
  { platform: "YouTube", label: "Subscribers", icon: FaYoutube, color: "text-red-500" },
  { platform: "YouTube", label: "Views", icon: FaYoutube, color: "text-red-500" },
  { platform: "Facebook", label: "Page Likes", icon: FaFacebook, color: "text-blue-500" },
  { platform: "Facebook", label: "Followers", icon: FaFacebook, color: "text-blue-500" },
];

export default function ExploreServices() {
  return (
    <section className="border-y border-white/10 bg-white/[0.02] py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Explore more services
          </h2>
          <p className="mt-4 text-white/60">
            Mix and match across platforms to build a complete growth
            strategy.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICES.map((svc, i) => (
            <motion.div
              key={`${svc.platform}-${svc.label}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              whileHover={{ y: -3 }}
            >
              <Link
                href="/signup?callbackUrl=/dashboard/orders/new"
                className="group flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm transition hover:border-brand-500/40 hover:bg-white/[0.06]"
              >
                <span className="flex items-center gap-2.5">
                  <svc.icon className={`h-4 w-4 shrink-0 ${svc.color}`} />
                  <span className="text-white/70">
                    {svc.platform} <span className="text-white">{svc.label}</span>
                  </span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/20 transition group-hover:text-accent-500" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
