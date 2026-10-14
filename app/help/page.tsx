"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackageLinks from "@/components/shared/PackageLinks";
import { SERVICE_FAQS } from "@/lib/faqs";
import { useState } from "react";
import { motion } from "motion/react";
import { Search, Package, ShieldCheck, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";


export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />
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
               <Link href="/dashboard/orders" className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white"><Package className="h-4 w-4 text-brand-400" /> Track order</Link>
               <button type="button" onClick={() => setSearchQuery("refill")} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white"><RefreshCw className="h-4 w-4 text-emerald-400" /> Refill Guarantee</button>
               <button type="button" onClick={() => setSearchQuery("refund")} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white"><ShieldCheck className="h-4 w-4 text-blue-400" /> Refund Policy</button>
               <Link href="/contact" className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white"><MessageSquare className="h-4 w-4 text-amber-400" /> Contact Us</Link>
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
                  <p className="text-sm text-zinc-400">View package details and delivery status in your dashboard.</p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-zinc-300">Sign in with the account used at checkout to see your orders. For guest purchases, contact support with your checkout email and package details.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button render={<Link href="/dashboard/orders" />} nativeButton={false}>View my orders</Button>
                <Button variant="outline" render={<Link href="/contact" />} nativeButton={false}>Guest order support</Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Common Questions</h2>
        <dl className="mt-10 space-y-8">
          {!SERVICE_FAQS.some(f => `${f.question} ${f.answer}`.toLowerCase().includes(searchQuery.toLowerCase())) && <p className="text-muted-foreground">No matching questions. <Link href="/contact" className="text-brand-600 hover:underline">Contact support</Link> for help.</p>}
          {SERVICE_FAQS.filter(f => `${f.question} ${f.answer}`.toLowerCase().includes(searchQuery.toLowerCase())).map((faq) => (
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
        <PackageLinks slugs={["instagram-comments", "tiktok-auto-likes", "twitter-votes"]} />
      </div>
      <Footer />
    </div>
  );
}
