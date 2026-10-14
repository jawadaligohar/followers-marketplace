import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { consumePasswordReset } from "@/lib/security/passwordReset";
import { resetPasswordSchema } from "@/lib/validation/auth";

async function postHandler(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  if (!(await consumePasswordReset(parsed.data.token, parsed.data.password))) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired" },
      { status: 400 }
    );
  }


  return NextResponse.json({ ok: true });
}

export const POST = secureRoute(postHandler);
