import { requireAdminPage } from "@/lib/adminGuard";
import OrdersTable from "@/components/admin/OrdersTable";
import SupplierStatusBanner from "@/components/admin/SupplierStatusBanner";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  getAdminOrders,
  searchValue,
  type AdminSearch,
} from "@/lib/adminQueries";
export const metadata = { title: "Orders | Surgeon Admin" };
const field = "rounded-lg border border-border bg-card px-3 py-2 text-sm";
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearch>;
}) {
  await requireAdminPage();
  const search = await searchParams;
  const result = await getAdminOrders(search);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Orders & processing</h1>
      <SupplierStatusBanner />
      <form className="flex flex-wrap gap-2">
        <input
          className={field}
          name="q"
          aria-label="Search orders"
          placeholder="Order ID, email, target or provider ID"
          defaultValue={searchValue(search, "q")}
        />
        {[
          {
            name: "status",
            title: "All statuses",
            options: [
              "pending",
              "processing",
              "completed",
              "failed",
              "cancelled",
            ],
          },
          {
            name: "method",
            title: "All payment methods",
            options: ["card", "crypto", "wallet", "bank", "bonus"],
          },
          {
            name: "provider",
            title: "All suppliers",
            options: ["jap", "peakerr", "tiksta"],
          },
          {
            name: "queue",
            title: "All queues",
            options: ["manual", "attention", "unpaid", "replacements"],
          },
        ].map((filter) => (
          <select
            key={filter.name}
            className={field}
            name={filter.name}
            aria-label={filter.title}
            defaultValue={searchValue(search, filter.name)}
          >
            <option value="">{filter.title}</option>
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ))}
        <button className={`${field} font-medium`} type="submit">
          Filter orders
        </button>
      </form>
      <OrdersTable key={JSON.stringify(search)} orders={result.rows} />
      <AdminPagination base="/admin/orders" search={search} {...result} />
    </div>
  );
}
