"use client";

import { motion } from "motion/react";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/shared/EmptyState";

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
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Wallet top-ups and order charges will appear here."
      />
    );
  }

  return (
    <Card className="overflow-x-auto border-border bg-card p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Type</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx, i) => (
            <motion.tr
              key={tx._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
              className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
            >
              <TableCell>{TYPE_LABELS[tx.type] ?? tx.type}</TableCell>
              <TableCell className="text-muted-foreground">{tx.note ?? "—"}</TableCell>
              <TableCell
                className={`font-medium ${tx.amountCents >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {tx.amountCents >= 0 ? "+" : ""}
                ${(tx.amountCents / 100).toFixed(2)}
              </TableCell>
              <TableCell className="text-foreground/80">${(tx.balanceAfterCents / 100).toFixed(2)}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(tx.createdAt).toLocaleDateString()}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
