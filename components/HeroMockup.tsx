"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Heart, UserPlus, MessageCircle } from "lucide-react";

const NOTIFICATIONS = [
  {
    name: "Sarah Jenkins",
    action: "started following you",
    time: "Just now",
    icon: UserPlus,
    iconColor: "text-brand-500",
    bg: "bg-brand-50",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
  },
  {
    name: "David Kim",
    action: "liked your photo",
    time: "2m ago",
    icon: Heart,
    iconColor: "text-red-500",
    bg: "bg-red-50",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
  },
  {
    name: "Elena Rodriguez",
    action: "left a comment",
    time: "5m ago",
    icon: MessageCircle,
    iconColor: "text-blue-500",
    bg: "bg-blue-50",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80",
  },
];

export default function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-brand-100 to-warm-rose/20 opacity-50 blur-2xl" />
      
      <div className="relative flex flex-col gap-4">
        {NOTIFICATIONS.map((notif, i) => (
          <motion.div
            key={notif.name}
            initial={{ opacity: 0, x: -20, y: 10 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.15 + 0.2, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-xl shadow-brand-500/5 transition-all"
          >
            <div className="relative h-12 w-12 shrink-0">
              <Image
                src={notif.avatar}
                alt={notif.name}
                fill
                className="rounded-full object-cover"
                sizes="48px"
              />
              <div className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${notif.bg}`}>
                <notif.icon className={`h-3 w-3 ${notif.iconColor}`} />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">
                {notif.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {notif.action}
              </div>
            </div>
            
            <div className="text-xs font-medium text-muted-foreground/60">
              {notif.time}
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
        className="absolute -right-8 -top-8 flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-white shadow-xl shadow-brand-500/20"
      >
        <div className="text-center">
          <div className="text-xl font-black leading-none">+99</div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">New</div>
        </div>
      </motion.div>
    </div>
  );
}
