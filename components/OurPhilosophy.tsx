"use client";

import Image from "next/image";
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
            className="relative aspect-[4/5] w-full"
          >
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] bg-brand-50 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=800&q=80"
                alt="Abstract warm gradient mesh"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {FLOATING_STATS.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: stat.delay }}
                className={`absolute hidden lg:flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-xl ${stat.className}`}
              >
                <motion.div
                  animate={stat.float}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2"
                >
                  <stat.icon className="h-4 w-4" />
                  {stat.label}
                </motion.div>
              </motion.div>
            ))}
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
