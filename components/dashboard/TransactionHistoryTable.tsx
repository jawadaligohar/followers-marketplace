import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <Card className="border-white/10 bg-white/[0.03] p-10 text-center text-sm text-muted-foreground">
        No transactions yet.
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto border-white/10 bg-white/[0.03] p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10">
            <TableHead>Type</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx._id} className="border-white/5">
              <TableCell>{TYPE_LABELS[tx.type] ?? tx.type}</TableCell>
              <TableCell className="text-muted-foreground">{tx.note ?? "—"}</TableCell>
              <TableCell
                className={`font-medium ${tx.amountCents >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {tx.amountCents >= 0 ? "+" : ""}
                ${(tx.amountCents / 100).toFixed(2)}
              </TableCell>
              <TableCell className="text-white/70">${(tx.balanceAfterCents / 100).toFixed(2)}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(tx.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
