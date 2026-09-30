import { ShieldCheck, Zap, Lock, Star } from "lucide-react";
import OrderForm from "./OrderForm";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "100% Safe & Secure" },
  { icon: Zap, label: "Instant Delivery" },
  { icon: Lock, label: "No Password Needed" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="glow absolute inset-x-0 top-0 h-[600px]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70">
            <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
            Trusted by 250,000+ creators worldwide
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Grow Your Socials with{" "}
            <span className="text-gradient">Real Engagement</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/60">
            Buy Instagram, TikTok, YouTube and Facebook followers, likes and
            views from a platform built for creators and brands. Fast,
            affordable, and secure — delivered in minutes.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70"
              >
                <badge.icon className="h-4 w-4 text-accent-500" />
                {badge.label}
              </div>
            ))}
          </div>
        </div>

        <OrderForm />
      </div>
    </section>
  );
}
