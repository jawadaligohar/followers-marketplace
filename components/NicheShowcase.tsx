"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle2, MapPin, Mail } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

const NICHES = [
  { 
    id: 'fitness', 
    name: 'Fitness', 
    icon: '💪', 
    handle: '@move.with.ava', 
    role: 'Fitness creator', 
    bio: ['Simple workouts & healthy habits', 'Fresh content every week', 'Collaborations open'], 
    startStats: { posts: '189', followers: '4,200', following: '388', engagement: 2.4 }, 
    endStats: { followers: '11,700', engagement: 6.4 } 
  },
  { 
    id: 'gaming', 
    name: 'Gaming', 
    icon: '🎮', 
    handle: '@pixel.ninja', 
    role: 'Streamer & Creator', 
    bio: ['Daily streams at 8PM EST', 'Pro FPS Player', 'Business inquiries in email'], 
    startStats: { posts: '412', followers: '1,200', following: '150', engagement: 1.8 }, 
    endStats: { followers: '8,500', engagement: 5.2 } 
  },
  { 
    id: 'music', 
    name: 'Music', 
    icon: '🎵', 
    handle: '@beats.by.jay', 
    role: 'Music Producer', 
    bio: ['Making beats in my bedroom', 'New track out now! 🎧', 'DM for collabs'], 
    startStats: { posts: '56', followers: '800', following: '120', engagement: 3.1 }, 
    endStats: { followers: '5,000', engagement: 8.5 } 
  },
  { 
    id: 'beauty', 
    name: 'Beauty', 
    icon: '💄', 
    handle: '@glow.daily', 
    role: 'Makeup Artist', 
    bio: ['Skincare routines & makeup tuts', 'Cruelty-free products only', 'Use code GLOW'], 
    startStats: { posts: '320', followers: '5,400', following: '450', engagement: 2.9 }, 
    endStats: { followers: '15,200', engagement: 7.1 } 
  },
  { 
    id: 'business', 
    name: 'Business', 
    icon: '💼', 
    handle: '@startup.hustle', 
    role: 'Entrepreneur', 
    bio: ['Tips for scaling your SaaS', 'Weekly newsletter link below', 'Angel Investor'], 
    startStats: { posts: '210', followers: '3,100', following: '200', engagement: 1.5 }, 
    endStats: { followers: '10,500', engagement: 4.8 } 
  },
  { 
    id: 'travel', 
    name: 'Travel', 
    icon: '✈️', 
    handle: '@globe.trotter', 
    role: 'Digital Nomad', 
    bio: ['Exploring the world full-time', 'Travel guides & hidden gems', 'Currently: Bali 🌴'], 
    startStats: { posts: '512', followers: '8,900', following: '620', engagement: 3.8 }, 
    endStats: { followers: '25,400', engagement: 9.2 } 
  },
  { 
    id: 'food', 
    name: 'Food', 
    icon: '🍕', 
    handle: '@tasty.bites', 
    role: 'Food Blogger', 
    bio: ['Easy recipes for busy people', 'Restaurant reviews', 'Comfort food enthusiast'], 
    startStats: { posts: '430', followers: '6,200', following: '800', engagement: 2.1 }, 
    endStats: { followers: '18,000', engagement: 6.8 } 
  },
  { 
    id: 'art', 
    name: 'Art', 
    icon: '🎨', 
    handle: '@canvas.dreams', 
    role: 'Digital Artist', 
    bio: ['Procreate tutorials', 'Commissions: OPEN', 'Prints available in shop'], 
    startStats: { posts: '150', followers: '2,800', following: '180', engagement: 4.2 }, 
    endStats: { followers: '12,000', engagement: 11.5 } 
  },
];

export default function NicheShowcase() {
  const [activeNiche, setActiveNiche] = useState(NICHES[0]);

  return (
    <section className="relative overflow-hidden bg-brand-50/50 py-24 sm:py-32">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-200/40 via-transparent to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-semibold text-brand-600 shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Built for every kind of account
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl"
          >
            600,000+ orders processed <br className="hidden sm:block" />
            across every niche
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-zinc-600 leading-relaxed"
          >
            From personal pages to growing brands, Surgeon helps profiles build visible momentum with flexible packages and incredibly fast delivery.
          </motion.p>
        </div>

        {/* Niche Selector Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {NICHES.map((niche) => {
            const isActive = activeNiche.id === niche.id;
            return (
              <button
                key={niche.id}
                onClick={() => setActiveNiche(niche)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  isActive 
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-105" 
                    : "bg-white text-zinc-600 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 hover:scale-105"
                }`}
              >
                <span>{niche.icon}</span>
                {niche.name}
              </button>
            );
          })}
        </div>

        {/* Showcase Cards */}
        <div className="mt-20 flex flex-col items-center justify-center gap-8 lg:flex-row lg:gap-12">
          
          {/* Starting Profile Card */}
          <div className="relative w-full max-w-sm rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-2xl shadow-zinc-200/50">
            <div className="absolute left-6 top-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Starting Profile
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNiche.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl border-2 border-brand-100">
                      {activeNiche.icon}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-800 blur-[4px] select-none">{activeNiche.handle}</div>
                      <div className="text-xs text-zinc-500">{activeNiche.role}</div>
                    </div>
                  </div>
                  <FaInstagram className="h-6 w-6 text-pink-500" />
                </div>

                <div className="mt-8 flex justify-between px-2 text-center">
                  <div>
                    <div className="text-xl font-bold text-zinc-900">{activeNiche.startStats.posts}</div>
                    <div className="text-[10px] font-medium uppercase text-zinc-500">Posts</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-zinc-900">{activeNiche.startStats.followers}</div>
                    <div className="text-[10px] font-medium uppercase text-zinc-500">Followers</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-zinc-900">{activeNiche.startStats.following}</div>
                    <div className="text-[10px] font-medium uppercase text-zinc-500">Following</div>
                  </div>
                </div>

                <div className="mt-8 rounded-xl bg-zinc-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-600">Engagement rate</span>
                    <span className="font-bold text-zinc-900">{activeNiche.startStats.engagement}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
                    <div className="h-full rounded-full bg-zinc-400 transition-all duration-1000" style={{ width: `${activeNiche.startStats.engagement * 5}%` }} />
                  </div>
                </div>

                <div className="mt-6 space-y-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-brand-400" /> {activeNiche.bio[0]}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-brand-400" /> {activeNiche.bio[1]}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-brand-400" /> {activeNiche.bio[2]}</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Center Arrow */}
          <div className="flex flex-col items-center gap-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-brand-500">
              Surgeon Boost
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white shadow-xl shadow-brand-500/30">
              <ArrowRight className="h-6 w-6" />
            </div>
          </div>

          {/* Growth Preview Card */}
          <div className="relative w-full max-w-sm rounded-[2rem] border border-brand-100 bg-white p-8 shadow-2xl shadow-brand-500/10">
            <div className="absolute left-6 top-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-500">
              <TrendingUpIcon className="h-3.5 w-3.5" /> Illustrative Growth
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNiche.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl border-2 border-brand-100">
                      {activeNiche.icon}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-800 blur-[4px] select-none">{activeNiche.handle}</div>
                      <div className="text-xs text-zinc-500">{activeNiche.role}</div>
                    </div>
                  </div>
                  <FaInstagram className="h-6 w-6 text-pink-500" />
                </div>

                <div className="mt-8 flex justify-between px-2 text-center items-center">
                  <div>
                    <div className="text-xl font-bold text-zinc-900">{activeNiche.startStats.posts}</div>
                    <div className="text-[10px] font-medium uppercase text-zinc-500">Posts</div>
                  </div>
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-white shadow-lg shadow-brand-500/40"
                  >
                    <div className="text-2xl font-black">{activeNiche.endStats.followers}</div>
                    <div className="text-[10px] font-bold uppercase opacity-90">Followers</div>
                  </motion.div>
                  <div>
                    <div className="text-xl font-bold text-zinc-900">{activeNiche.startStats.following}</div>
                    <div className="text-[10px] font-medium uppercase text-zinc-500">Following</div>
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 rounded-xl bg-emerald-50 p-4 border border-emerald-100"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-emerald-800">Engagement rate</span>
                    <span className="font-bold text-emerald-600">{activeNiche.endStats.engagement}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-emerald-200">
                    <motion.div 
                      initial={{ width: `${activeNiche.startStats.engagement * 5}%` }}
                      animate={{ width: `${Math.min(100, activeNiche.endStats.engagement * 10)}%` }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-emerald-500" 
                    />
                  </div>
                </motion.div>

                <div className="mt-6 space-y-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-brand-400" /> {activeNiche.bio[0]}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-brand-400" /> {activeNiche.bio[1]}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-brand-400" /> {activeNiche.bio[2]}</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
