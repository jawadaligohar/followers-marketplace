import Link from "next/link";
import { Wallet, ArrowRight } from "lucide-react";

export default function WalletBalanceCard({ walletBalanceCents }: { walletBalanceCents: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/10 to-accent-500/5 p-6">
      <div className="flex items-center gap-2 text-sm text-white/50">
        <Wallet className="h-4 w-4" />
        Wallet balance
      </div>
      <div className="mt-2 text-3xl font-extrabold text-gradient">
        ${(walletBalanceCents / 100).toFixed(2)}
      </div>
      <Link
        href="/dashboard/wallet"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-500 hover:underline"
      >
        Top up wallet <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
