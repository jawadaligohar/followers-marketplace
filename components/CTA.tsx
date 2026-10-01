"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glow relative overflow-hidden border-border bg-gradient-to-br from-brand-50 to-warm-lilac/20 px-8 py-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to grow your audience?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of creators and businesses already growing faster
            with Surgeon. Get started in less than 2 minutes.
          </p>
          <motion.div
            className="mt-8 inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              variant="default"
              className="px-8 py-6"
              render={<Link href="/#pricing" />}
            >
              Start Growing Now
            </Button>
          </motion.div>
        </Card>
      </motion.div>
    </section>
  );
}
