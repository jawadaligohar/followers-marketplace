import { adminEmailActivity } from "@/lib/adminActivity";
import { searchValue, type AdminSearch } from "@/lib/adminQueries";
import AdminPagination from "@/components/admin/AdminPagination";
import EmailActivity from "@/components/admin/EmailActivity";
export const metadata = { title: "Email activity | Surgeon Admin" };
export default async function EmailPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearch>;
}) {
  const search = await searchParams;
  const result = await adminEmailActivity(search);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Transactional email activity</h1>
      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          aria-label="Search email activity"
          placeholder="Recipient or subject"
          defaultValue={searchValue(search, "q")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <select
          name="status"
          aria-label="Email status"
          defaultValue={searchValue(search, "status")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Queued</option>
          <option value="sent">Accepted by provider</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-border px-4 text-sm"
        >
          Filter emails
        </button>
      </form>
      <EmailActivity
        key={JSON.stringify(search)}
        messages={result.rows}
        configured={Boolean(
          process.env.RESEND_API_KEY && process.env.EMAIL_FROM,
        )}
      />
      <AdminPagination base="/admin/emails" search={search} {...result} />
    </div>
  );
}
