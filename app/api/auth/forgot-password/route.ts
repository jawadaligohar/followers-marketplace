import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { issuePasswordReset } from "@/lib/security/passwordReset";
import { consumeLimit } from "@/lib/security/rateLimit";
import { trustedAppOrigin } from "@/lib/security/request";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";

async function postHandler(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  await dbConnect();
  const limit = await consumeLimit("password-reset-email", parsed.data.email, 3, 3600000);
  if (!limit.allowed) return NextResponse.json({ ok: true });
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");

  // Always respond ok to avoid leaking which emails have accounts.
  if (user?.passwordHash) {
    const token = await issuePasswordReset(String(user._id));
    const appUrl = trustedAppOrigin(req);
    try { await sendPasswordResetEmail(user.email, `${appUrl}/reset-password?token=${token}`); }
    catch { /* Same public response whether an account or mail provider exists. */ }
  }

  return NextResponse.json({ ok: true });
}

export const POST = secureRoute(postHandler);
