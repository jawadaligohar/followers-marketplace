"use client";

import { ShieldCheck, Zap, Lock, Star, Headset, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import OrderForm from "./OrderForm";
import AnimatedBackground from "./AnimatedBackground";
import PaymentMethods from "./PaymentMethods";
import Image from "next/image";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "100% Safe & Secure" },
  { icon: Zap, label: "Instant Delivery" },
  { icon: Lock, label: "No Password Needed" },
  { icon: RefreshCw, label: "30-Day Refill" },
  { icon: Headset, label: "24/7 Support" },
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
    <section className="relative overflow-hidden bg-background">
      {/* Beautiful Abstract Background Layer */}
      <div className="absolute inset-0 z-0">
         <Image 
           src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
           alt="Abstract warm liquid gradient" 
           fill 
           className="object-cover opacity-10 blur-xl dark:opacity-20"
           priority
         />
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </div>
      <div className="glow absolute inset-x-0 top-0 z-0 h-[600px] opacity-50" />
      
      <AnimatedBackground />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-10 lg:grid-cols-2 lg:items-center lg:pb-28 lg:pt-16">
        <motion.div variants={container} initial="hidden" animate="show">
          <div className="mb-6 flex items-center gap-4">
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-600 shadow-sm backdrop-blur-md dark:text-brand-400"
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Star className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
              </motion.span>
              Join 250,000+ happy creators & brands
            </motion.div>
          </div>

          <motion.h1
            variants={item}
            className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-7xl lg:leading-[1.1]"
          >
            Grow an <br className="hidden lg:block"/>
            Audience <br className="hidden lg:block"/>
            <span className="text-gradient drop-shadow-sm">You Love.</span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-xl text-lg text-muted-foreground">
            Connect with real people on Instagram, TikTok, YouTube and Facebook. We help creators and brands build authentic audiences—fast, affordable, and fully secure. Let's grow together.
          </motion.p>

          <div className="mt-8 flex flex-wrap items-center gap-3 pb-6">
            {TRUST_BADGES.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                whileHover={{ y: -2, borderColor: "rgba(249, 115, 22, 0.4)" }}
                className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm"
              >
                <badge.icon className="h-3.5 w-3.5 text-brand-500" />
                {badge.label}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
           {/* Floating Deco Element */}
           <motion.div 
             animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
             transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
             className="absolute -right-6 -top-6 z-20 hidden h-24 w-24 rounded-full bg-gradient-to-tr from-brand-400 to-accent-400 blur-xl opacity-60 lg:block"
           />
          <OrderForm />
        </motion.div>
      </div>

      <div className="relative z-10 px-6 pb-16">
        <PaymentMethods />
      </div>
    </section>
  );
}
