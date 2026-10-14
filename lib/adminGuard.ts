import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  await dbConnect();
  const user = await User.findById(session.user.id).select("role").lean();
  if (user?.role !== "admin") return null;
  return session;
}
