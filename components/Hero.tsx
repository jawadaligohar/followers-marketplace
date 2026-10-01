"use client";

import { ShieldCheck, Zap, Lock, Star } from "lucide-react";
import { motion } from "motion/react";
import OrderForm from "./OrderForm";
import AnimatedBackground from "./AnimatedBackground";
import PaymentMethods from "./PaymentMethods";
import HeroPortrait from "./HeroPortrait";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "100% Safe & Secure" },
  { icon: Zap, label: "Instant Delivery" },
  { icon: Lock, label: "No Password Needed" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="glow absolute inset-x-0 top-0 h-[600px]" />
      <AnimatedBackground />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-10 lg:grid-cols-2 lg:items-start lg:pb-28 lg:pt-16">
        <motion.div variants={container} initial="hidden" animate="show">
          <div className="mb-6 flex items-center gap-4">
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Star className="h-3.5 w-3.5 fill-accent-500 text-brand-600" />
              </motion.span>
              Trusted by 250,000+ creators worldwide
            </motion.div>
          </div>

          <motion.h1
            variants={item}
            className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            Grow Your Socials with{" "}
            <span className="text-gradient">Real Engagement</span>
          </motion.h1>

          <motion.div variants={item} className="my-6 flex justify-start sm:hidden">
            <HeroPortrait />
          </motion.div>

          <motion.p variants={item} className="mt-6 max-w-xl text-lg text-muted-foreground">
            Buy Instagram, TikTok, YouTube and Facebook followers, likes and
            views from a platform built for creators and brands. Fast,
            affordable, and secure — delivered in minutes.
          </motion.p>

          <div className="mt-8 flex flex-wrap items-center gap-6 pb-6">
            <motion.div variants={item} className="hidden pb-3 pl-3 sm:block">
              <HeroPortrait size={140} />
            </motion.div>
            <motion.div variants={item} className="flex flex-wrap gap-4">
              {TRUST_BADGES.map((badge, i) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                  whileHover={{ y: -2, borderColor: "rgba(109,91,255,0.5)" }}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm"
                >
                  <badge.icon className="h-4 w-4 text-brand-600" />
                  {badge.label}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <OrderForm />
        </motion.div>
      </div>

      <div className="relative px-6 pb-16">
        <PaymentMethods />
      </div>
    </section>
  );
}
