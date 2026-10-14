import Link from "next/link";
import { Gift, Star, Ticket, Wallet } from "lucide-react";
import { DRAW_ENTRY_CENTS } from "@/lib/benefitMath";
const offers = [
  {
    icon: Gift,
    title: "50 free likes with every paid order",
    detail:
      "One bonus for a public post on the first platform in your checkout. Claim it using your private order link.",
    href: "/rewards",
  },
  {
    icon: Wallet,
    title: "5% off with wallet payments",
    detail:
      "Top up your balance and save on every package you pay for from your wallet.",
    href: "/dashboard/wallet",
  },
  {
    icon: Star,
    title: "1% back as loyalty credit",
    detail:
      "Paid package purchases earn credit you can redeem into your wallet. Refunds adjust your reward balance.",
    href: "/rewards",
  },
  {
    icon: Ticket,
    title: "Monthly draw entries",
    detail: `Every $${(DRAW_ENTRY_CENTS / 100).toFixed(2)} of qualifying spend earns an entry. Top-ups count once; spending that balance is not counted again.`,
    href: "/rewards",
  },
];
export default function Offers() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="text-3xl font-bold">More with every order</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {offers.map(({ icon: Icon, ...offer }) => (
          <Link
            key={offer.title}
            href={offer.href}
            className="rounded-2xl border border-border bg-card p-5 transition hover:border-brand-500/40"
          >
            <Icon className="h-6 w-6 text-brand-500" />
            <h3 className="mt-3 font-semibold">{offer.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{offer.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
