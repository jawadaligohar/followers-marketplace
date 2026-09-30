export type TransactionRow = {
  _id: string;
  type: string;
  amountCents: number;
  balanceAfterCents: number;
  note: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  topup: "Top-up",
  order_debit: "Order",
  refund: "Refund",
  admin_adjustment: "Adjustment",
};

export default function TransactionHistoryTable({ transactions }: { transactions: TransactionRow[] }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40">
        No transactions yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Note</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Balance</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3">{TYPE_LABELS[tx.type] ?? tx.type}</td>
              <td className="px-4 py-3 text-white/50">{tx.note ?? "—"}</td>
              <td
                className={`px-4 py-3 font-medium ${
                  tx.amountCents >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {tx.amountCents >= 0 ? "+" : ""}
                ${(tx.amountCents / 100).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-white/70">${(tx.balanceAfterCents / 100).toFixed(2)}</td>
              <td className="px-4 py-3 text-white/40">
                {new Date(tx.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
