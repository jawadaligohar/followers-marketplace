import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { Order } from "@/lib/db/models/Order";
import { EmailOutbox } from "@/lib/db/models/Benefits";
import { orderAccessToken, verifyOrderAccessToken } from "@/lib/orderAccess";
import { sendMail } from "@/lib/mailer";
const schema = z.object({ token: z.string().max(512).optional() });
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json(
      { error: "Sign in to verify your email" },
      { status: 401 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid verification link" },
      { status: 400 },
    );
  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (parsed.data.token) {
    const payload = verifyOrderAccessToken(parsed.data.token);
    const [purpose, userId, expiry, ...emailParts] = payload?.split(":") || [];
    if (
      purpose !== "verify-email" ||
      userId !== String(user._id) ||
      Number(expiry) < Date.now() ||
      !Number.isSafeInteger(Number(expiry)) ||
      emailParts.join(":") !== user.email
    )
      return NextResponse.json(
        {
          error:
            "This verification link is invalid, expired, or belongs to another account",
        },
        { status: 400 },
      );
    user.emailVerified = new Date();
    await user.save();
    await Order.updateMany({ guestEmail: user.email, userId: null }, { $set: { userId: user._id }, $unset: { guestEmail: "" } });
    return NextResponse.json({ verified: true });
  }
  if (user.emailVerified) return NextResponse.json({ verified: true });
  const token = orderAccessToken(
    `verify-email:${user._id}:${Date.now() + 86400000}:${user.email}`,
  );
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    new URL(request.url).origin;
  const message = await EmailOutbox.findOneAndUpdate(
    { key: `verify:${user._id}:${new Date().toISOString().slice(0, 10)}` },
    {
      $setOnInsert: {
        to: user.email,
        subject: "Verify your email for Surgeon rewards",
        text: `While signed in to your account, open this link and confirm your email:\n${origin}/verify-email?token=${encodeURIComponent(token)}\n\nThe link expires in 24 hours. If you did not request verification, ignore this message.`,
      },
    },
    { upsert: true, returnDocument: "after" },
  );
  let sent = message.status === "sent";
  if (!sent) {
    try {
      sent = await sendMail({
        to: message.to,
        subject: message.subject,
        text: message.text,
        idempotencyKey: message.key,
      });
      if (sent) {
        message.status = "sent";
        await message.save();
      }
    } catch {
      /* Keep the message queued. */
    }
  }
  return NextResponse.json({ queued: true, sent });
}
