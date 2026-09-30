"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-grid px-6 py-16">
      <div className="glow absolute inset-x-0 top-0 h-[500px]" />
      <AnimatedBackground />
      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <motion.span
              whileHover={{ rotate: 12, scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500"
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.span>
            <span className="text-lg font-bold tracking-tight">Surgeon</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/40 backdrop-blur-sm"
        >
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
