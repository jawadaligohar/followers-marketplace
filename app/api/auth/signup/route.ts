import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { Order } from "@/lib/db/models/Order";
import { signupSchema } from "@/lib/validation/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  await dbConnect();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    provider: "credentials",
    role: "customer",
    walletBalanceCents: 0,
  });

  // Link any prior guest orders placed with this email to the new account.
  await Order.updateMany(
    { guestEmail: email.toLowerCase(), userId: null },
    { $set: { userId: user._id }, $unset: { guestEmail: "" } }
  );

  return NextResponse.json({ ok: true });
}
