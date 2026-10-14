"use client";

import Link from "next/link";
import {
  Sparkles,
  LayoutDashboard,
  ListOrdered,
  Users,
  Boxes,
  Mail,
  Wallet,
} from "lucide-react";
import SidebarNav from "@/components/shared/SidebarNav";
import UserMenu from "@/components/shared/UserMenu";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ListOrdered },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Wallet ledger", href: "/admin/transactions", icon: Wallet },
  { label: "Email activity", href: "/admin/emails", icon: Mail },
  { label: "Services", href: "/admin/services", icon: Boxes },
  { label: "Payments & rewards", href: "/admin/benefits", icon: Sparkles },
];

export default function AdminShell({
  children,
  name,
  email,
}: {
  children: React.ReactNode;
  name?: string | null;
  email?: string | null;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="text-base font-bold">Surgeon Admin</span>
          </Link>
          <UserMenu name={name} email={email} />
        </div>
      </header>
      <nav
        aria-label="Mobile admin navigation"
        className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <SidebarNav items={NAV_ITEMS} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
