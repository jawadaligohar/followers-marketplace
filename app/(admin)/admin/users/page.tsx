import UsersTable from "@/components/admin/UsersTable";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  getAdminUsers,
  searchValue,
  type AdminSearch,
} from "@/lib/adminQueries";
export const metadata = { title: "Users | Surgeon Admin" };
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearch>;
}) {
  const search = await searchParams;
  const result = await getAdminUsers(search);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">All users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registered accounts, order history, net paid spending and wallet
          balances. Guest purchases appear in Orders.
        </p>
      </div>
      <form className="flex flex-wrap gap-2">
        <input
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          name="q"
          aria-label="Search users"
          placeholder="Search name or email"
          defaultValue={searchValue(search, "q")}
        />
        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          name="role"
          aria-label="User role"
          defaultValue={searchValue(search, "role")}
        >
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <button
          className="rounded-lg border border-border px-4 py-2 text-sm"
          type="submit"
        >
          Find users
        </button>
      </form>
      <UsersTable key={JSON.stringify(search)} users={result.rows} />
      <AdminPagination base="/admin/users" search={search} {...result} />
    </div>
  );
}
