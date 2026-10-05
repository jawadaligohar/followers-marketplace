import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { Transaction } from "@/lib/db/models/Transaction";
import WalletBalanceCard from "@/components/dashboard/WalletBalanceCard";
import TopUpForm from "@/components/dashboard/TopUpForm";
import TransactionHistoryTable, { TransactionRow } from "@/components/dashboard/TransactionHistoryTable";
import FadeIn from "@/components/shared/FadeIn";

export const metadata = { title: "Wallet | Surgeon" };

export default async function WalletPage() {
  const session = await auth();
  await dbConnect();

  const transactions = await Transaction.find({ userId: session!.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const rows: TransactionRow[] = transactions.map((tx) => ({
    _id: tx._id.toString(),
    type: tx.type,
    amountCents: tx.amountCents,
    balanceAfterCents: tx.balanceAfterCents,
    note: tx.note,
    createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
  }));

  return (
    <div className="space-y-8">
      <FadeIn>
        <h1 className="text-2xl font-bold">Wallet</h1>
      </FadeIn>

      <FadeIn delay={0.05} className="grid gap-6 lg:grid-cols-2">
        <WalletBalanceCard walletBalanceCents={session!.user.walletBalanceCents} />
        <TopUpForm />
      </FadeIn>

      <FadeIn delay={0.1}>
        <h2 className="mb-3 text-lg font-semibold">Transaction history</h2>
        <TransactionHistoryTable transactions={rows} />
      </FadeIn>
    </div>
  );
}
