import { adminTransactions } from "@/lib/adminActivity";
import { searchValue, type AdminSearch } from "@/lib/adminQueries";
import AdminPagination from "@/components/admin/AdminPagination";
import WalletLedger from "@/components/admin/WalletLedger";
export const metadata = { title: "Wallet ledger | Surgeon Admin" };
export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearch>;
}) {
  const search = await searchParams;
  const userId = searchValue(search, "user");
  const result = await adminTransactions(
    search,
    /^[a-f\d]{24}$/i.test(userId) ? userId : undefined,
  );
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Wallet ledger</h1>
      <p className="text-sm text-muted-foreground">
        Top-ups, purchases, refunds, rewards and staff adjustments. Zero-amount
        rows record external card/crypto payments without changing wallet
        credit.
      </p>
      <form className="flex flex-wrap gap-2">
        {userId && <input type="hidden" name="user" value={userId} />}
        <input
          name="q"
          aria-label="Search wallet ledger"
          placeholder="Reason, processor reference or order ID"
          defaultValue={searchValue(search, "q")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <select
          name="type"
          aria-label="Transaction type"
          defaultValue={searchValue(search, "type")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">All transaction types</option>
          {[
            "topup",
            "order_debit",
            "refund",
            "admin_adjustment",
            "reward_credit",
          ].map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 text-sm"
        >
          Filter ledger
        </button>
      </form>
      <WalletLedger rows={result.rows} />
      <AdminPagination base="/admin/transactions" search={search} {...result} />
    </div>
  );
}
