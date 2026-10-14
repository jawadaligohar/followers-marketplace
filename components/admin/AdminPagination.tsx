import Link from "next/link";
import { searchValue, type AdminSearch } from "@/lib/adminQueries";
export default function AdminPagination({
  base,
  search,
  page,
  pages,
  total,
}: {
  base: string;
  search: AdminSearch;
  page: number;
  pages: number;
  total: number;
}) {
  function url(next: number) {
    const params = new URLSearchParams();
    for (const key of Object.keys(search)) {
      const value = searchValue(search, key);
      if (value && key !== "page") params.set(key, value);
    }
    params.set("page", String(next));
    return `${base}?${params}`;
  }
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 text-sm"
    >
      <p className="text-muted-foreground">
        {total} results · Page {page} of {pages}
      </p>
      <div className="flex gap-4">
        {page > 1 && (
          <Link href={url(page - 1)} className="hover:underline">
            Previous
          </Link>
        )}
        {page < pages && (
          <Link href={url(page + 1)} className="hover:underline">
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
