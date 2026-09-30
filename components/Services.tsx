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
    color: "text-pink-500",
    name: "Instagram Growth",
    desc: "Followers, likes, views and comments to boost your profile's reach and credibility.",
    from: "$2.49",
  },
  {
    icon: FaTiktok,
    color: "text-white",
    name: "TikTok Growth",
    desc: "Get more followers, likes and views to push your videos onto the For You page.",
    from: "$2.49",
  },
  {
    icon: FaYoutube,
    color: "text-red-500",
    name: "YouTube Growth",
    desc: "Subscribers, views and watch time to grow your channel and unlock monetization.",
    from: "$4.99",
  },
  {
    icon: FaFacebook,
    color: "text-blue-500",
    name: "Facebook Growth",
    desc: "Page likes, followers and post engagement to strengthen your brand presence.",
    from: "$5.01",
  },
  {
    icon: FaXTwitter,
    color: "text-white",
    name: "X / Twitter Growth",
    desc: "Followers, likes and retweets to amplify your voice and reach more people.",
    from: "$3.99",
  },
  {
    icon: FaTelegram,
    color: "text-sky-400",
    name: "Telegram Growth",
    desc: "Channel members and post views to build an active, engaged community.",
    from: "$3.29",
  },
];

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Every platform, one place
        </h2>
        <p className="mt-4 text-white/60">
          Whatever platform you create on, we have a service built to help
          you grow faster.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, i) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Card className="group border-white/10 bg-white/[0.03] p-6 transition hover:border-brand-500/50 hover:bg-white/[0.06]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:border-brand-500/40">
                <service.icon className={`h-5 w-5 ${service.color}`} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{service.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{service.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-white/40">
                  From <span className="font-semibold text-white">{service.from}</span>
                </span>
                <a
                  href="#pricing"
                  className="text-sm font-medium text-accent-500 opacity-0 transition group-hover:opacity-100"
                >
                  Order now →
                </a>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
