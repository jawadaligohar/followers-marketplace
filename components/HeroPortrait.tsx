"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { TrendingUp, Users } from "lucide-react";

const FLOATING_STATS = [
  {
    icon: TrendingUp,
    label: "+80% Engagement",
    className: "-left-4 top-6 bg-warm-amber text-warm-amber-foreground",
    delay: 0.6,
    float: { y: [0, -8, 0] },
  },
  {
    icon: Users,
    label: "250K+ Creators",
    className: "-right-3 bottom-8 bg-warm-rose text-warm-rose-foreground",
    delay: 0.8,
    float: { y: [0, 8, 0] },
  },
];

export default function HeroPortrait({ size = 128 }: { size?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-3xl border border-border shadow-xl shadow-black/10">
        <Image
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80"
          alt="Creator checking growth on their phone"
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {FLOATING_STATS.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, ...stat.float }}
          transition={{
            opacity: { duration: 0.4, delay: stat.delay },
            y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: stat.delay },
          }}
          className={`absolute flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-lg ${stat.className}`}
        >
          <stat.icon className="h-3 w-3" />
          {stat.label}
        </motion.div>
      ))}
    </motion.div>
  );
}
