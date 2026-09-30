"use client";

import { motion } from "motion/react";
import {
  SiVisa,
  SiMastercard,
  SiAmericanexpress,
  SiApplepay,
  SiGooglepay,
  SiPaypal,
  SiBitcoin,
  SiTether,
} from "react-icons/si";

const METHODS = [
  { name: "Visa", icon: SiVisa },
  { name: "Mastercard", icon: SiMastercard },
  { name: "American Express", icon: SiAmericanexpress },
  { name: "Apple Pay", icon: SiApplepay },
  { name: "Google Pay", icon: SiGooglepay },
  { name: "PayPal", icon: SiPaypal },
  { name: "Bitcoin", icon: SiBitcoin },
  { name: "USDT", icon: SiTether },
];

export default function PaymentMethods() {
  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-white/30">
        Secure payments powered by
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {METHODS.map((method, i) => (
          <motion.div
            key={method.name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.25)" }}
            title={method.name}
            className="flex h-10 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-colors hover:text-white"
          >
            <method.icon className="h-5 w-5" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
