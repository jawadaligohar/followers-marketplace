"use client";

import {
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaFacebook,
  FaXTwitter,
  FaTelegram,
} from "react-icons/fa6";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";

const SERVICES = [
  {
    icon: FaInstagram,
    color: "text-pink-600",
    bg: "bg-pink-50/50 hover:bg-pink-50",
    badge: "bg-pink-100/50 text-pink-600",
    name: "Instagram Growth",
    desc: "Followers, likes, views and comments to boost your profile's reach and credibility.",
    from: "$2.49",
  },
  {
    icon: FaTiktok,
    color: "text-foreground",
    bg: "bg-slate-50/50 hover:bg-slate-50",
    badge: "bg-slate-200/50 text-slate-700",
    name: "TikTok Growth",
    desc: "Get more followers, likes and views to push your videos onto the For You page.",
    from: "$2.49",
  },
  {
    icon: FaYoutube,
    color: "text-red-600",
    bg: "bg-red-50/50 hover:bg-red-50",
    badge: "bg-red-100/50 text-red-600",
    name: "YouTube Growth",
    desc: "Subscribers, views and watch time to grow your channel and unlock monetization.",
    from: "$4.99",
  },
  {
    icon: FaFacebook,
    color: "text-blue-600",
    bg: "bg-blue-50/50 hover:bg-blue-50",
    badge: "bg-blue-100/50 text-blue-600",
    name: "Facebook Growth",
    desc: "Page likes, followers and post engagement to strengthen your brand presence.",
    from: "$5.01",
  },
  {
    icon: FaXTwitter,
    color: "text-foreground",
    bg: "bg-zinc-50/50 hover:bg-zinc-50",
    badge: "bg-zinc-200/50 text-zinc-700",
    name: "X / Twitter Growth",
    desc: "Followers, likes and retweets to amplify your voice and reach more people.",
    from: "$3.99",
  },
  {
    icon: FaTelegram,
    color: "text-sky-500",
    bg: "bg-sky-50/50 hover:bg-sky-50",
    badge: "bg-sky-100/50 text-sky-600",
    name: "Telegram Growth",
    desc: "Channel members and post views to build an active, engaged community.",
    from: "$3.29",
  },
];

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Where your community lives
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          From photo feeds to short-form video, we make it simple to find your people on any app.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, i) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="group relative"
          >
            <Card className={`h-full border-none p-8 transition-colors ${service.bg} shadow-none`}>
              <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${service.badge} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                <service.icon className={`h-6 w-6 ${service.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground">{service.name}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{service.desc}</p>
              
              <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Starts at <span className="text-foreground">{service.from}</span>
                </span>
                <a
                  href="#pricing"
                  className={`text-sm font-bold opacity-0 transition-opacity group-hover:opacity-100 ${service.color}`}
                >
                  Explore →
                </a>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
