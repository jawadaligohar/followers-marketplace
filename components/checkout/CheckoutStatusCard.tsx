"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ICONS = {
  success: CheckCircle2,
  cancel: XCircle,
} as const;

export default function CheckoutStatusCard({
  status,
  title,
  description,
  ctaLabel,
  ctaHref,
  ctaVariant = "default",
  children,
}: {
  status: "success" | "cancel";
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant?: "default" | "outline";
  children?: React.ReactNode;
}) {
  const Icon = ICONS[status];
  const iconClassName = status === "success" ? "text-brand-600" : "text-muted-foreground/50";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-grid px-6">
      <div className="glow absolute inset-x-0 top-0 h-[500px]" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl shadow-black/10"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.15, type: "spring", bounce: 0.5 }}
          className="mx-auto flex h-16 w-16 items-center justify-center"
        >
          <Icon className={`h-12 w-12 ${iconClassName}`} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-2 text-xl font-bold"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          {description}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Button variant={ctaVariant} className="mt-6" render={<Link href={ctaHref} />}>
            {ctaLabel}
          </Button>
        </motion.div>
        {children}
      </motion.div>
    </div>
  );
}
