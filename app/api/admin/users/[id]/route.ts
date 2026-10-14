import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { applyWalletTransaction } from "@/lib/wallet";

const patchSchema = z
  .object({
    role: z.enum(["customer", "admin"]).optional(),
    walletAdjustmentCents: z
      .number()
      .int()
      .min(-10000000)
      .max(10000000)
      .optional(),
    reason: z.string().trim().min(3).max(200).optional(),
  })
  .refine(
    (data) => Boolean(data.role) !== Boolean(data.walletAdjustmentCents),
    "Choose one account change at a time",
  )
  .refine(
    (data) => !data.walletAdjustmentCents || Boolean(data.reason),
    "A wallet adjustment reason is required",
  );

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id))
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await dbConnect();
  const existing = await User.findById(id).select("role");
  if (!existing)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (parsed.data.role === "customer" && id === session.user.id)
    return NextResponse.json(
      { error: "You cannot remove your own administrator access" },
      { status: 400 },
    );

  if (parsed.data.role) {
    await User.findByIdAndUpdate(id, { role: parsed.data.role });
  }

  try {
    if (parsed.data.walletAdjustmentCents) {
      await applyWalletTransaction({
        userId: id,
        type: "admin_adjustment",
        amountCents: parsed.data.walletAdjustmentCents,
        note: `${parsed.data.reason} (admin: ${session.user.email})`,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Wallet adjustment failed",
      },
      { status: 400 },
    );
  }

  const user = await User.findById(id).select(
    "name email role walletBalanceCents emailVerified createdAt",
  );
  return NextResponse.json({ user });
}
