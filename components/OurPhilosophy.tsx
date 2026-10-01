"use client";

import { motion } from "motion/react";
import { HeartHandshake, Leaf, Sparkles, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const PILLARS = [
  {
    icon: Leaf,
    title: "Organic at heart",
    description:
      "Growth should feel natural. We pace delivery to respect your community's natural rhythm.",
  },
  {
    icon: HeartHandshake,
    title: "Real connections",
    description:
      "No bots. No ghosts. We bring real, active users to your profile to build authentic audiences.",
  },
];

const FLOATING_STATS = [
  {
    icon: TrendingUp,
    label: "+80% Engagement",
    className: "-left-12 top-20 bg-warm-amber text-warm-amber-foreground",
    delay: 0.6,
    float: { y: [0, -12, 0] },
  },
  {
    icon: Users,
    label: "250K+ Creators",
    className: "-right-8 bottom-32 bg-warm-rose text-warm-rose-foreground",
    delay: 0.8,
    float: { y: [0, 12, 0] },
  },
];

export default function OurPhilosophy() {
  return (
    <section className="overflow-hidden bg-white py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:gap-24">
        
        <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[2.5rem] bg-brand-50 border border-brand-100 shadow-2xl"
          >
            {/* Bright gradient background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-300/30 via-transparent to-brand-500/10" />
            <div className="absolute -left-1/4 -top-1/4 h-full w-full rounded-full bg-orange-400/10 blur-[80px]" />
            <div className="absolute -bottom-1/4 -right-1/4 h-full w-full rounded-full bg-rose-400/10 blur-[80px]" />
            
            {/* Subtle Decorations */}
            <div className="absolute inset-0 z-0 opacity-40">
              <div className="absolute right-1/4 top-1/4 text-2xl font-light text-brand-500">+</div>
              <div className="absolute left-1/4 top-1/4 h-0.5 w-4 -rotate-45 bg-brand-400" />
              <div className="absolute bottom-1/4 right-1/3 h-0.5 w-6 rotate-12 bg-rose-400" />
              <div className="absolute bottom-1/3 left-1/4 text-xl font-light text-brand-500">+</div>
              <svg className="absolute bottom-1/4 left-1/3 w-12 h-12 text-brand-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }} />
              </svg>
            </div>

            <div className="relative z-10 w-full max-w-[280px]">
              {/* Central Main Box - Dashboard Snapshot */}
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-3xl bg-white p-6 shadow-xl shadow-brand-500/10 border border-brand-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Followers</div>
                    <div className="text-2xl font-black text-foreground">248K</div>
                  </div>
                </div>

                {/* Growth Chart */}
                <div className="mt-6 flex items-end justify-between gap-1.5 h-16">
                  {[30, 45, 40, 60, 50, 80, 100].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, type: "spring" }}
                      className={`w-full rounded-md ${i === 6 ? 'bg-gradient-to-t from-brand-600 to-brand-400' : 'bg-brand-100'}`}
                    />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Floating Top Left Pill: Recent Order */}
            <motion.div
              animate={{ y: [0, -8, 0], x: [0, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-2 top-20 z-20 flex items-center gap-3 rounded-2xl border border-brand-100 bg-white/90 px-4 py-2 shadow-xl backdrop-blur-md sm:-left-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900">5,000 Likes</span>
                <span className="text-[10px] text-zinc-500">Delivered instantly</span>
              </div>
            </motion.div>

            {/* Floating Bottom Right Pill: Organic */}
            <motion.div
              animate={{ y: [0, 8, 0], x: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-24 right-2 z-20 flex items-center gap-3 rounded-2xl border border-brand-100 bg-white/90 px-4 py-2 shadow-xl backdrop-blur-md sm:-right-6"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Leaf className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-zinc-900">100% Organic</span>
            </motion.div>

            {/* Avatar Cluster */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-8 left-8 z-20 flex -space-x-3 rounded-full border border-brand-100 bg-white/90 p-2 shadow-xl backdrop-blur-md"
            >
              {[
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop&crop=faces",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
              ].map((src, i) => (
                <img key={i} src={src} alt="User" className="h-8 w-8 rounded-full border-2 border-white object-cover" />
              ))}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-[10px] font-bold text-white">
                +250k
              </div>
            </motion.div>
            
            {/* Top Right Floating Metric */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute right-6 top-8 z-20 flex flex-col items-center justify-center rounded-2xl border border-brand-100 bg-white/90 p-3 shadow-xl backdrop-blur-md"
            >
              <div className="text-xl font-black text-brand-500">+85%</div>
              <div className="text-[10px] font-semibold uppercase text-zinc-500">Engagement</div>
            </motion.div>
          </motion.div>
        </div>

        <div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl"
          >
            We're building the <span className="text-gradient">community</span> you deserve
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg text-muted-foreground leading-relaxed"
          >
            We're not just another growth tool. We're a team of creators building the platform we always wished we had. We believe your audience should be as real as your content.
          </motion.p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              >
                <Card className="h-full border-none bg-brand-50/50 p-6 shadow-none transition hover:bg-brand-50">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-500 shadow-sm">
                    <pillar.icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-lg font-bold text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
