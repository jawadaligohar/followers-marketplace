import Link from "next/link";
import { Sparkles, LayoutDashboard, ListOrdered, PlusCircle, Wallet } from "lucide-react";
import SidebarNav from "@/components/shared/SidebarNav";
import UserMenu from "@/components/shared/UserMenu";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/dashboard/orders", icon: ListOrdered },
  { label: "New Order", href: "/dashboard/orders/new", icon: PlusCircle },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
];

export default function DashboardShell({
  children,
  name,
  email,
  walletBalanceCents,
}: {
  children: React.ReactNode;
  name?: string | null;
  email?: string | null;
  walletBalanceCents: number;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="text-base font-bold">Surgeon</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/wallet"
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-accent-500 sm:flex"
            >
              <Wallet className="h-3.5 w-3.5" />${(walletBalanceCents / 100).toFixed(2)}
            </Link>
            <UserMenu name={name} email={email} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <SidebarNav items={NAV_ITEMS} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
