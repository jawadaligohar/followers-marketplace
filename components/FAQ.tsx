"use client";

import { motion } from "motion/react";
import { SERVICE_FAQS } from "@/lib/faqs";
import PackageLinks from "@/components/shared/PackageLinks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


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
          Package details, payment options, and delivery explained before you order.
        </p>
      </motion.div>

      <Accordion defaultValue={["item-0"]} className="mt-12 space-y-3">
        {SERVICE_FAQS.map((faq, i) => (
          <motion.div
            key={faq.question}
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
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
      <PackageLinks slugs={["instagram-auto-likes", "twitter-votes"]} />
    </section>
  );
}
