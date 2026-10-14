import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import type { adminTransactions } from "@/lib/adminActivity";
export default function WalletLedger({
  rows,
}: {
  rows: Awaited<ReturnType<typeof adminTransactions>>["rows"];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {[
              "Customer",
              "Type",
              "Amount",
              "Wallet balance after",
              "Reference / reason",
              "Date",
            ].map((title) => (
              <th key={title} className="p-3">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border">
              <td className="p-3">{row.email}</td>
              <td className="p-3">{row.type.replaceAll("_", " ")}</td>
              <td
                className={`whitespace-nowrap p-3 ${row.amountCents < 0 ? "text-rose-600" : "text-emerald-600"}`}
              >
                {row.amountCents > 0 ? "+" : ""}$
                {(row.amountCents / 100).toFixed(2)}
              </td>
              <td className="p-3">
                ${(row.balanceAfterCents / 100).toFixed(2)}
              </td>
              <td className="max-w-72 break-all p-3 text-xs">
                <p>{row.note}</p>
                <p className="font-mono text-muted-foreground">
                  {row.processorReference}
                </p>
                {row.relatedOrderId && (
                  <Link
                    href={`/admin/orders?q=${row.relatedOrderId}`}
                    className="text-brand-600 hover:underline"
                  >
                    Order {row.relatedOrderId}
                  </Link>
                )}
              </td>
              <td className="whitespace-nowrap p-3 text-xs">
                {formatDateTime(row.createdAt).date}
                <br />
                {formatDateTime(row.createdAt).time}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="p-5 text-sm text-muted-foreground">
          No matching wallet transactions.
        </p>
      )}
    </div>
  );
}
