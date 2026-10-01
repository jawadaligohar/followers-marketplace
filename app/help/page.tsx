"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Search, Package, ShieldCheck, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FAQS = [
  { question: "When will my order start?", answer: "Most orders begin processing immediately after payment is confirmed. Depending on the service, you should see results within 1-12 hours." },
  { question: "What is the 30-day refill guarantee?", answer: "If your follower or like count drops within 30 days of purchase, we will automatically refill the dropped amount completely free of charge. No questions asked." },
  { question: "Is my account safe?", answer: "Absolutely. We never ask for your password or sensitive information. Our methods comply with platform limits to ensure your account remains 100% secure." },
  { question: "Do you offer refunds?", answer: "Yes, if we fail to deliver your order within the promised timeframe, we offer a full refund. Please contact support to initiate a request." },
];

export default function HelpPage() {
  const [trackId, setTrackId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-zinc-950 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-600/30 via-zinc-950 to-zinc-950" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand-500">Help Centre</h2>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Everything customers ask before buying followers, likes, views, and live-event support.
            </p>
            
            <div className="mt-10 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur-md">
              <Search className="ml-3 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search questions, e.g. refill"
                className="w-full bg-transparent p-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
               <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white"><Package className="h-4 w-4 text-brand-400" /> Track order</div>
               <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white"><RefreshCw className="h-4 w-4 text-emerald-400" /> Refill Guarantee</div>
               <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white"><ShieldCheck className="h-4 w-4 text-blue-400" /> Refund Policy</div>
               <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white"><MessageSquare className="h-4 w-4 text-amber-400" /> Contact Us</div>
            </div>
          </div>

          {/* Floating Order Tracker Widget */}
          <div className="mt-16 sm:mt-24 lg:absolute lg:right-8 lg:top-1/2 lg:mt-0 lg:w-[450px] lg:-translate-y-1/2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20">
                  <Package className="h-6 w-6 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Where&apos;s my order?</h3>
                  <p className="text-sm text-zinc-400">Use the order ID from your confirmation email.</p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-black/40 p-6">
                 {/* Progress Steps Mockup */}
                 <div className="relative space-y-6">
                    <div className="absolute bottom-6 left-3.5 top-2 w-0.5 bg-zinc-800" />
                    
                    <div className="relative flex items-center gap-4">
                       <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] z-10">
                         <div className="h-2 w-2 rounded-full bg-white" />
                       </div>
                       <div className="font-medium text-white">Order placed</div>
                    </div>
                    
                    <div className="relative flex items-center gap-4">
                       <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 border-2 border-brand-500 z-10">
                         <div className="h-2 w-2 rounded-full bg-brand-500" />
                       </div>
                       <div className="flex-1">
                         <div className="font-medium text-white">In progress</div>
                         <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800">
                           <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-brand-500 to-accent-500" />
                         </div>
                       </div>
                    </div>

                    <div className="relative flex items-center gap-4">
                       <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 z-10" />
                       <div className="font-medium text-zinc-500">Completed</div>
                    </div>
                 </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Input 
                  placeholder="e.g. 628de..." 
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:ring-brand-500"
                />
                <Button className="shrink-0 bg-brand-500 hover:bg-brand-600 text-white">Track &rarr;</Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Common Questions</h2>
        <dl className="mt-10 space-y-8">
          {FAQS.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase())).map((faq) => (
            <div key={faq.question} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <dt className="text-lg font-semibold leading-7 text-foreground">
                {faq.question}
              </dt>
              <dd className="mt-2 text-base leading-7 text-muted-foreground">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
