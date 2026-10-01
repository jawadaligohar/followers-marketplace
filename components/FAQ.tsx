"use client";

import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is it safe to use this service?",
    a: "Yes. We never ask for your password and use safe delivery methods that comply with each platform's terms to minimize any risk to your account.",
  },
  {
    q: "How fast will I see results?",
    a: "Most orders start processing within minutes and complete within a few hours, depending on the size of your order and chosen service.",
  },
  {
    q: "Do I need to give you my password?",
    a: "Never. We only need your public profile link, username, or the URL of the post you'd like to boost.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards, PayPal, and several cryptocurrencies for privacy-conscious customers.",
  },
  {
    q: "Can I get a refund if something goes wrong?",
    a: "Yes, we offer a satisfaction guarantee. If your order doesn't deliver as described, our support team will refund or refill it.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-muted-foreground">
          Everything you need to know before placing your first order.
        </p>
      </motion.div>

      <Accordion defaultValue={["item-0"]} className="mt-12 space-y-3">
        {FAQS.map((faq, i) => (
          <motion.div
            key={faq.q}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
          >
            <AccordionItem
              value={`item-${i}`}
              className="overflow-hidden rounded-2xl border border-border bg-card px-6 transition-colors hover:border-brand-500/30"
            >
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </section>
  );
}
