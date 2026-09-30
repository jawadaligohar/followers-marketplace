import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { applyWalletTransaction } from "@/lib/wallet";

const patchSchema = z.object({
  role: z.enum(["customer", "admin"]).optional(),
  walletAdjustmentCents: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await dbConnect();

  if (parsed.data.role) {
    await User.findByIdAndUpdate(id, { role: parsed.data.role });
  }

  if (parsed.data.walletAdjustmentCents) {
    await applyWalletTransaction({
      userId: id,
      type: "admin_adjustment",
      amountCents: parsed.data.walletAdjustmentCents,
      note: `Adjusted by admin ${session.user.email}`,
    });
  }

  const user = await User.findById(id).select("-passwordHash");
  return NextResponse.json({ user });
}
