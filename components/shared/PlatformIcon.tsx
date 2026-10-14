"use client";

import type { IconType } from "react-icons";
import { FaInstagram, FaTiktok, FaFacebook, FaXTwitter } from "react-icons/fa6";
import { cn } from "@/lib/utils";

export const PLATFORM_STYLES: Record<string, { icon: IconType; color: string; badge: string }> = {
  instagram: { icon: FaInstagram, color: "text-pink-500", badge: "bg-pink-100/60 text-pink-600" },
  tiktok: { icon: FaTiktok, color: "text-foreground", badge: "bg-slate-200/60 text-slate-800" },
  facebook: { icon: FaFacebook, color: "text-blue-500", badge: "bg-blue-100/60 text-blue-600" },
  twitter: { icon: FaXTwitter, color: "text-foreground", badge: "bg-zinc-200/60 text-zinc-800" },
};

export default function PlatformIcon({
  platformId,
  className,
  colored = true,
}: {
  platformId: string;
  className?: string;
  colored?: boolean;
}) {
  const style = PLATFORM_STYLES[platformId];
  if (!style) return null;
  const Icon = style.icon;
  return <Icon className={cn("h-4 w-4 shrink-0", colored && style.color, className)} aria-hidden />;
}
