"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, TrendingUp, ShieldCheck, Headset, Wallet } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

const BENEFITS = [
  { icon: TrendingUp, title: "Track every order from one dashboard" },
  { icon: Wallet, title: "Pay with your wallet for a flat 15% off" },
  { icon: Headset, title: "Get support whenever you need it" },
];

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
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className="flex min-h-screen w-full bg-background md:grid md:grid-cols-2">
      {/* Left Column (Dark/Benefits) - Hidden on mobile */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white md:flex lg:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-600/20 via-zinc-950 to-zinc-950" />
        
        {/* Floating Abstract Elements */}
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2">
          {/* Subtle Decorations */}
          <div className="absolute -right-12 -top-12 text-3xl font-light text-white/20">+</div>
          <div className="absolute -left-8 -top-4 h-0.5 w-6 -rotate-45 bg-white/20" />
          <div className="absolute bottom-0 right-0 h-0.5 w-6 rotate-12 bg-white/20" />
          <div className="absolute bottom-4 -right-16 text-2xl font-light text-white/20">-</div>
          
          {/* Faint hand-drawn arrow */}
          <svg className="absolute -left-20 bottom-0 w-16 h-16 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
          </svg>

          {/* Layered concentric background shapes */}
          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-brand-500/5 backdrop-blur-xl rotate-[15deg]" />
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-brand-500/10 backdrop-blur-lg -rotate-[8deg]" />
          
          {/* Central Box */}
          <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] bg-white shadow-[0_0_50px_rgba(249,115,22,0.15)]">
             <TrendingUp className="h-14 w-14 text-brand-500" />
          </div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-24 top-0 flex items-center gap-3 rounded-2xl border border-white/5 bg-white px-4 py-3 text-sm font-bold shadow-2xl"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100">
              <Wallet className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <span className="text-zinc-900">15% off with wallet</span>
          </motion.div>
          
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -right-24 bottom-4 flex items-center gap-3 rounded-2xl border border-white/5 bg-white px-4 py-3 text-sm font-bold shadow-2xl"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-zinc-900">Every order tracked</span>
          </motion.div>
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider backdrop-blur-md transition hover:bg-white/10">
            <ArrowLeft className="h-3 w-3" />
            Surgeon
          </Link>
          <div className="mt-24">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {isLogin ? "Welcome back." : "Create your account."}
            </h1>
            <p className="mt-4 max-w-sm text-lg text-zinc-400">
              Track orders, top up your wallet, and manage everything from one dashboard.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-auto space-y-3 pt-24">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                <b.icon className="h-5 w-5 text-brand-400" />
              </div>
              <span className="text-sm font-medium text-zinc-200">{b.title}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Column (Form) */}
      <div className="relative flex flex-1 items-center justify-center p-6 md:p-10">
        <AnimatedBackground />
        
        {/* Mobile Header */}
        <div className="absolute left-6 top-6 md:hidden">
          <motion.button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </motion.button>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8 md:hidden">
            <h1 className="text-3xl font-bold tracking-tight">
              {isLogin ? "Welcome back." : "Create Account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          <div className="hidden md:mb-8 md:block">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-500">
              {isLogin ? "Login" : "Account"}
            </h2>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Create Account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          {children}

          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
            <ShieldCheck className="h-3.5 w-3.5" />
            256-bit encrypted &middot; secure
          </div>
        </div>
      </div>
    </div>
  );
}
