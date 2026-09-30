import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  await dbConnect();

  const user = await User.findOne({
    resetPasswordToken: parsed.data.token,
    resetPasswordTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired" },
      { status: 400 }
    );
  }

  user.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  user.resetPasswordToken = null;
  user.resetPasswordTokenExpiry = null;
  await user.save();

  return NextResponse.json({ ok: true });
}
