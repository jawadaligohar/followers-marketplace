"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles, ShieldCheck, ArrowLeft } from "lucide-react";
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
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-grid px-6 py-16">
      <div className="glow absolute inset-x-0 top-0 h-[500px]" />
      <AnimatedBackground />

      <motion.button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ x: -2 }}
        className="absolute left-6 top-6 z-10 flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition hover:border-brand-500/30 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </motion.button>

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
          className="rounded-3xl border border-border bg-card p-8 shadow-2xl shadow-black/10 backdrop-blur-sm"
        >
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          256-bit encrypted &middot; no password ever shared with us
        </motion.div>
      </div>
    </div>
  );
}
