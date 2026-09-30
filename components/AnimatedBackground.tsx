"use client";

import { motion } from "motion/react";

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-brand-500/20 blur-[120px]"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, 40, -20, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-accent-500/15 blur-[120px]"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 30, -30, 0],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
