"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Trash2, ArrowRight, PackageOpen } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa6";
import { useCart } from "@/lib/cart/CartContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const PLATFORM_ICONS: Record<string, { icon: typeof FaInstagram; color: string }> = {
  instagram: { icon: FaInstagram, color: "text-pink-500" },
  tiktok: { icon: FaTiktok, color: "text-white" },
  facebook: { icon: FaFacebook, color: "text-blue-500" },
};

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, removeItem, totalCents, count } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open cart"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/20 hover:text-white"
      >
        <ShoppingCart className="h-4 w-4" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-background"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <SheetContent side="right" className="flex flex-col bg-background">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-left">
            <ShoppingCart className="h-4 w-4 text-accent-500" />
            Your cart {count > 0 && `(${count})`}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <PackageOpen className="h-6 w-6 text-white/30" />
            </span>
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Button variant="outline" onClick={() => setOpen(false)} render={<Link href="/#pricing" />}>
              Browse services
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const meta = PLATFORM_ICONS[item.platformId];
                  const Icon = meta?.icon;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        {Icon && <Icon className={`h-4 w-4 ${meta.color}`} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {item.platformLabel} {item.category}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.qty}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold">
                          ${(item.priceCents / 100).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="mt-1 text-white/30 transition hover:text-red-400"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="border-t border-white/10 px-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-gradient">
                  ${(totalCents / 100).toFixed(2)}
                </span>
              </div>
              <Button
                variant="brand"
                className="mt-4 flex w-full items-center justify-center gap-2 py-5"
                onClick={() => setOpen(false)}
                render={<Link href="/checkout" />}
              >
                Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
