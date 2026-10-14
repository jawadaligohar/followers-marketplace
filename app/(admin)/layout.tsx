import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/adminGuard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!(await requireAdmin())) redirect("/dashboard");

  return (
    <AdminShell name={session.user.name} email={session.user.email}>
      {children}
    </AdminShell>
  );
}
