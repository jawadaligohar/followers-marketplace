"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { Menu, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import CartDrawer from "@/components/cart/CartDrawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQ", href: "#faq" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 flex flex-col shadow-sm"
    >
      {/* Announcement Bar */}
      <div className="flex items-center justify-center gap-3 bg-brand-500 px-4 py-2 text-xs font-medium text-white sm:text-sm">
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
          Trusted
        </span>
        <span className="hidden sm:inline">
          Secure checkout &bull; 30-Day Refill Guarantee &bull; 24/7 Live Support
        </span>
        <span className="sm:hidden">
          Secure checkout &bull; 24/7 support
        </span>
      </div>

      {/* Main Nav */}
      <div className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <motion.span
              whileHover={{ rotate: 12, scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500"
            >
              <Heart className="h-5 w-5 text-white" />
            </motion.span>
            <span className="text-lg font-bold tracking-tight">Surgeon</span>
          </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <CartDrawer />
          {isAuthed ? (
            <Button variant="default" render={<Link href="/dashboard" />}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Sign in
              </Link>
              <Button variant="default" render={<Link href="/signup" />}>
                Get Started
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CartDrawer />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Toggle menu">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
          <SheetContent side="right" className="bg-background">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-left">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
                  <Heart className="h-4 w-4 text-white" />
                </span>
                Surgeon
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 px-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <Button
                variant="default"
                onClick={() => setOpen(false)}
                render={<Link href={isAuthed ? "/dashboard" : "/signup"} />}
              >
                {isAuthed ? "Go to Dashboard" : "Get Started"}
              </Button>
            </nav>
          </SheetContent>
          </Sheet>
        </div>
      </div>
      </div>
    </motion.header>
  );
}
