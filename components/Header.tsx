"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import {
  Menu,
  Heart,
  ChevronDown,
  PlayCircle,
  MessageCircle,
  Eye,
  ThumbsUp,
  Users,
  Repeat,
  Repeat2,
  Vote,
  Headphones,
  Radio,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  getCatalogService,
  PLATFORM_ORDER,
  PLATFORMS,
  type PlatformId,
} from "@/lib/catalog";
import { useServices } from "@/lib/cart/useServices";
import PlatformIcon from "@/components/shared/PlatformIcon";
import { Button } from "@/components/ui/button";
import CartDrawer from "@/components/cart/CartDrawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function serviceIcon(category: string): LucideIcon {
  if (category.startsWith("Auto")) return Repeat;
  if (category.includes("Retweet")) return Repeat2;
  if (category.includes("Comment")) return MessageCircle;
  if (category.includes("Vote")) return Vote;
  if (category.includes("Listener")) return Headphones;
  if (category.includes("Live")) return Radio;
  if (category.includes("Reel")) return PlayCircle;
  if (category.includes("Page")) return ThumbsUp;
  if (category.includes("View")) return Eye;
  if (category.includes("Follower")) return Users;
  return Heart;
}

const NAV_LINKS = [
  { label: "Services", href: "/services", hasMegaMenu: true },
  { label: "Pricing", href: "/#pricing" },
  { label: "Rewards", href: "/rewards" },
  { label: "Track order", href: "/track-order" },
  { label: "Help", href: "/help" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const { services, loaded } = useServices();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesTrigger = useRef<HTMLButtonElement>(null);
  const [menuPlatform, setMenuPlatform] = useState<PlatformId>("instagram");
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const dashboardHref =
    session?.user?.role === "admin" ? "/admin" : "/dashboard";
  const dashboardLabel =
    session?.user?.role === "admin" ? "Admin dashboard" : "Go to Dashboard";

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
          Secure checkout &bull; 30-Day Refill Guarantee &bull; 24/7 Live
          Support
        </span>
        <span className="sm:hidden">Secure checkout &bull; 24/7 support</span>
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

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <div
                key={link.label}
                className="group/navitem relative py-2"
                onMouseEnter={() => link.hasMegaMenu && setServicesOpen(true)}
                onMouseLeave={() => link.hasMegaMenu && setServicesOpen(false)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    setServicesOpen(false);
                }}
                onKeyDown={(event) => {
                  if (link.hasMegaMenu && event.key === "Escape") {
                    setServicesOpen(false);
                    servicesTrigger.current?.focus();
                  }
                }}
              >
                {link.hasMegaMenu ? (
                  <button
                    ref={servicesTrigger}
                    type="button"
                    aria-expanded={servicesOpen}
                    aria-controls="desktop-services"
                    onClick={() => setServicesOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setServicesOpen(true);
                        requestAnimationFrame(() =>
                          document
                            .getElementById("desktop-services")
                            ?.querySelector<HTMLButtonElement>("button")
                            ?.focus(),
                        );
                      }
                    }}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    {link.label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    {link.label}
                    {link.hasMegaMenu && (
                      <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover/navitem:rotate-180" />
                    )}
                  </Link>
                )}

                {link.hasMegaMenu && (
                  <div
                    id="desktop-services"
                    hidden={!servicesOpen}
                    className="absolute -left-12 top-full w-[640px] pt-2"
                  >
                    <div className="flex rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/10">
                      {/* Left Sidebar - Platforms */}
                      <div className="w-1/3 border-r border-border pr-4">
                        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Platforms
                        </div>
                        <ul className="space-y-1">
                          {PLATFORM_ORDER.map((p) => (
                            <li key={p}>
                              <button
                                type="button"
                                aria-pressed={menuPlatform === p}
                                onClick={() => setMenuPlatform(p)}
                                onMouseEnter={() => setMenuPlatform(p)}
                                onFocus={() => setMenuPlatform(p)}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                  menuPlatform === p
                                    ? "bg-brand-500/10 text-brand-600"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                <PlatformIcon platformId={p} colored={false} />
                                {PLATFORMS[p].label}
                              </button>
                            </li>
                          ))}
                        </ul>
                        <Link
                          href="/services"
                          onClick={() => setServicesOpen(false)}
                          className="mt-4 flex items-center gap-1 px-3 text-xs font-medium text-brand-600 hover:underline"
                        >
                          All services <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>

                      {/* Right Side - Services */}
                      <div className="w-2/3 pl-4">
                        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {PLATFORMS[menuPlatform].label} services
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {services
                            .filter(
                              (service) => service.platformId === menuPlatform,
                            )
                            .map((s) => {
                              const Icon = serviceIcon(s.category);
                              return (
                                <Link
                                  href={`/services/${s.slug}`}
                                  key={s.slug}
                                  onClick={() => setServicesOpen(false)}
                                  className="flex items-start gap-3 rounded-xl p-2 transition hover:bg-muted"
                                >
                                  <div className="mt-0.5 rounded-full bg-zinc-100 p-1.5 dark:bg-zinc-800">
                                    <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">
                                      {s.category}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {getCatalogService(s.slug)?.tagline ||
                                        "View packages"}
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          {loaded &&
                            !services.some(
                              (service) => service.platformId === menuPlatform,
                            ) && (
                              <p className="col-span-2 p-2 text-sm text-muted-foreground">
                                No services are available for this platform
                                right now.
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <CartDrawer />
            {isAuthed ? (
              <Button
                variant="default"
                render={<Link href={dashboardHref} />}
                nativeButton={false}
              >
                {dashboardLabel}
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Log in
                </Link>
                <Button
                  variant="default"
                  render={<Link href="/services" />}
                  nativeButton={false}
                >
                  Order now
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <CartDrawer />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Toggle menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                }
              />
              <SheetContent
                side="right"
                className="overflow-y-auto bg-background"
              >
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
                  {PLATFORM_ORDER.map((platform) => (
                    <details
                      key={platform}
                      className="rounded-xl border border-border p-3"
                    >
                      <summary className="cursor-pointer text-sm font-semibold">
                        {PLATFORMS[platform].label} packages
                      </summary>
                      <div className="mt-3 grid gap-2">
                        {services
                          .filter((service) => service.platformId === platform)
                          .map((service) => (
                            <Link
                              key={service.slug}
                              href={`/services/${service.slug}`}
                              onClick={() => setOpen(false)}
                              className="rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              {service.category}
                            </Link>
                          ))}
                      </div>
                    </details>
                  ))}
                  <div className="mt-4 flex flex-col gap-3">
                    {isAuthed ? (
                      <Button
                        variant="default"
                        onClick={() => setOpen(false)}
                        render={<Link href={dashboardHref} />}
                        nativeButton={false}
                      >
                        {dashboardLabel}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setOpen(false)}
                          render={<Link href="/login" />}
                          nativeButton={false}
                        >
                          Log in
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => setOpen(false)}
                          render={<Link href="/services" />}
                          nativeButton={false}
                        >
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
