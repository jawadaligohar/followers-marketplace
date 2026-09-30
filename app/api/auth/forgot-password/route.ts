import { NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  await dbConnect();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

  // Always respond ok to avoid leaking which emails have accounts.
  if (user && user.provider === "credentials") {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail(user.email, `${appUrl}/reset-password?token=${token}`);
  }

  return NextResponse.json({ ok: true });
}
