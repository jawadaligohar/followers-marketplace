"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Trash2, ArrowRight, PackageOpen } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import PlatformIcon from "@/components/shared/PlatformIcon";
import OrderExtras from "@/components/shared/OrderExtras";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, removeItem, totalCents, count } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open cart"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-brand-500/30 hover:text-foreground"
      >
        <ShoppingCart className="h-4 w-4" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <SheetContent side="right" className="flex flex-col bg-background">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-left">
            <ShoppingCart className="h-4 w-4 text-brand-600" />
            Your cart {count > 0 && `(${count})`}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
              <PackageOpen className="h-6 w-6 text-muted-foreground/50" />
            </span>
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Button variant="outline" onClick={() => setOpen(false)} render={<Link href="/services" />} nativeButton={false}>
              Browse services
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                        <PlatformIcon platformId={item.platformId} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          <Link href={`/services/${item.slug}?qty=${item.qtyValue}#buy`} onClick={() => setOpen(false)} className="hover:underline">{item.platformLabel} {item.category}</Link>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.qty}</div>
                        <OrderExtras order={item} />
                        {item.unavailable && <p className="mt-1 text-xs text-red-600">This package is no longer available. Remove it and choose a current package.</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold">
                          ${(item.priceCents / 100).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="mt-1 text-muted-foreground/50 transition hover:text-rose-500"
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

            <div className="border-t border-border px-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-gradient">
                  ${(totalCents / 100).toFixed(2)}
                </span>
              </div>
              <Button
                variant="default"
                className="mt-4 flex w-full items-center justify-center gap-2 py-5"
                onClick={() => setOpen(false)}
                render={<Link href="/checkout" />}
                nativeButton={false}
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
