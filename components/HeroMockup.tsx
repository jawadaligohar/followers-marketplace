"use client";

import { motion } from "motion/react";
import { Heart, UserPlus, TrendingUp } from "lucide-react";
import { FaInstagram } from "react-icons/fa6";

const BARS = [30, 45, 38, 55, 48, 65, 72, 85, 78, 95];

export default function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400">
            <FaInstagram className="h-5 w-5 text-white" />
          </span>
          <div>
            <div className="text-sm font-semibold">Instagram Followers</div>
            <div className="flex items-center gap-1.5 text-xs text-accent-500">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-accent-500"
              />
              Delivery in progress
            </div>
          </div>
        </div>

        <div className="mt-5 flex h-28 items-end gap-1.5">
          {BARS.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: "easeOut" }}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-brand-500 to-accent-500"
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-accent-500" />
          Growing steadily over the last 7 days
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -12, y: 8 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="absolute -left-6 top-6 flex items-center gap-2 rounded-full border border-white/10 bg-background/90 px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur-sm"
      >
        <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" />
        Likes
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 12, y: -8 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.75 }}
        className="absolute -right-4 bottom-10 flex items-center gap-2 rounded-full border border-white/10 bg-background/90 px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur-sm"
      >
        <UserPlus className="h-3.5 w-3.5 text-accent-500" />
        UK Followers
      </motion.div>
    </div>
  );
}
