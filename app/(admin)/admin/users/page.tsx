import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import UsersTable, { AdminUserRow } from "@/components/admin/UsersTable";
import FadeIn from "@/components/shared/FadeIn";

export const metadata = { title: "Users | Surgeon Admin" };

export default async function AdminUsersPage() {
  await dbConnect();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();

  const rows: AdminUserRow[] = users.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    walletBalanceCents: u.walletBalanceCents,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
  }));

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-bold">All users</h1>
      </FadeIn>
      <FadeIn delay={0.05}>
        <UsersTable users={rows} />
      </FadeIn>
    </div>
  );
}
