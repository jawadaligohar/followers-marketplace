"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card px-10 py-14 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted"
      >
        <Icon className="h-6 w-6 text-muted-foreground/50" />
      </motion.div>
      <p className="mt-4 text-sm font-medium text-foreground/80">{title}</p>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </Card>
  );
}
