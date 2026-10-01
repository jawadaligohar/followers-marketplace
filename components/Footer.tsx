"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = {
  Services: ["Instagram", "TikTok", "YouTube", "Facebook", "Telegram"],
  Company: ["About Us", "Contact", "Blog", "Careers"],
  Legal: ["Terms of Service", "Privacy Policy", "Refund Policy"],
};

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4 }}
          >
            <Link href="/" className="flex items-center gap-2">
              <motion.span
                whileHover={{ rotate: 12, scale: 1.05 }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500"
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.span>
              <span className="text-base font-bold">Surgeon</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The fastest way to grow your social media presence — trusted by
              creators and brands worldwide.
            </p>
          </motion.div>

          {Object.entries(FOOTER_LINKS).map(([title, links], colIndex) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: 0.1 + colIndex * 0.08 }}
            >
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="group relative text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {link}
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-brand-500/60 transition-all duration-300 group-hover:w-full" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <Separator className="mt-12 bg-border" />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-muted-foreground/70 sm:flex-row"
        >
          <p>© {new Date().getFullYear()} Surgeon. All rights reserved.</p>
          <p>Not affiliated with Instagram, TikTok, YouTube or Facebook.</p>
        </motion.div>
      </div>
    </footer>
  );
}
