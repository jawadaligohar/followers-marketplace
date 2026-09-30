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
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-white/60">
          Everything you need to know before placing your first order.
        </p>
      </div>

      <Accordion defaultValue={["item-0"]} className="mt-12 space-y-3">
        {FAQS.map((faq, i) => (
          <AccordionItem
            key={faq.q}
            value={`item-${i}`}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-6"
          >
            <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-white/50">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
