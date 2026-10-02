"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Heart, ChevronDown, PlayCircle, MessageCircle, Eye, ThumbsUp, Users } from "lucide-react";
import { FaInstagram, FaFacebook, FaTwitter, FaTiktok } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import CartDrawer from "@/components/cart/CartDrawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MEGA_MENU_SERVICES = [
  { name: "Instagram Likes", icon: Heart, desc: "Give every post a lift" },
  { name: "Instagram Followers", icon: Users, desc: "Grow your audience" },
  { name: "TikTok Views", icon: Eye, desc: "Push videos further" },
  { name: "TikTok Comments", icon: MessageCircle, desc: "Get the conversation going" },
  { name: "Twitter Auto Likes", icon: ThumbsUp, desc: "Likes on every new post" },
  { name: "Reel Views", icon: PlayCircle, desc: "More plays on your Reels" },
];

const NAV_LINKS = [
  { label: "Services", href: "#services", hasMegaMenu: true },
  { label: "Pricing", href: "#pricing" },
  { label: "Help", href: "/help" },
  { label: "Contact", href: "/contact" },
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
      className="sticky top-0 z-50 flex flex-col shadow-sm group/header"
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
              <div key={link.label} className="group/navitem relative py-2">
                <Link
                  href={link.href}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  {link.label}
                  {link.hasMegaMenu && <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover/navitem:rotate-180" />}
                </Link>

                {link.hasMegaMenu && (
                  <div className="invisible absolute -left-12 top-full mt-2 w-[600px] opacity-0 transition-all duration-200 group-hover/navitem:visible group-hover/navitem:opacity-100">
                    <div className="flex rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/10">
                      {/* Left Sidebar - Platforms */}
                      <div className="w-1/3 border-r border-border pr-4">
                        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Platforms</div>
                        <ul className="space-y-1">
                          <li><div className="flex cursor-pointer items-center justify-between rounded-lg bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-600"><span className="flex items-center gap-2"><FaInstagram className="h-4 w-4" /> Instagram</span></div></li>
                          <li><div className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><span className="flex items-center gap-2"><FaTiktok className="h-4 w-4" /> TikTok</span></div></li>
                          <li><div className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><span className="flex items-center gap-2"><FaFacebook className="h-4 w-4" /> Facebook</span></div></li>
                          <li><div className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><span className="flex items-center gap-2"><FaTwitter className="h-4 w-4" /> Twitter</span></div></li>
                        </ul>
                      </div>
                      
                      {/* Right Side - Services */}
                      <div className="w-2/3 pl-4">
                         <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                           <span>Services</span>
                           <span className="text-brand-500 underline decoration-brand-500/30 underline-offset-2">Most Popular</span>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           {MEGA_MENU_SERVICES.map((s) => (
                             <Link href="#services" key={s.name} className="flex items-start gap-3 rounded-xl p-2 transition hover:bg-muted">
                               <div className="mt-0.5 rounded-full bg-zinc-100 p-1.5 dark:bg-zinc-800"><s.icon className="h-4 w-4 text-zinc-600 dark:text-zinc-300" /></div>
                               <div>
                                 <div className="text-sm font-medium">{s.name}</div>
                                 <div className="text-xs text-muted-foreground">{s.desc}</div>
                               </div>
                             </Link>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <CartDrawer />
            {isAuthed ? (
              <Button variant="default" render={<Link href="/dashboard" />} nativeButton={false}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Log in
                </Link>
                <Button variant="default" render={<Link href="/signup" />} nativeButton={false}>
                  Order now
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <CartDrawer />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Toggle menu" nativeButton={false}>
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
                <nav className="mt-8 flex flex-col gap-6">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="text-lg font-semibold text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="mt-4 flex flex-col gap-3">
                    {isAuthed ? (
                      <Button variant="default" onClick={() => setOpen(false)} render={<Link href="/dashboard" />} nativeButton={false}>
                        Go to Dashboard
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setOpen(false)} render={<Link href="/login" />} nativeButton={false}>
                          Log in
                        </Button>
                        <Button variant="default" onClick={() => setOpen(false)} render={<Link href="/signup" />} nativeButton={false}>
                          Order now
                        </Button>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
