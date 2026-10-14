import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAdmin } from "@/lib/adminGuard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  return (
    <DashboardShell
      name={session.user.name}
      email={session.user.email}
      walletBalanceCents={session.user.walletBalanceCents}
      isAdmin={Boolean(await requireAdmin())}
    >
      {children}
    </DashboardShell>
  );
}
