import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { Order } from "@/lib/db/models/Order";
import { dbConnect } from "@/lib/db/connect";
import { claimBonus } from "@/lib/benefits";
import { orderGroupKey, verifyOrderAccessToken } from "@/lib/orderAccess";
const schema = z.object({
  token: z.string().max(512).optional(),
  orderId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  targetLink: z.url().max(2048),
});
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a public post URL" },
      { status: 400 },
    );
  await dbConnect();
  let groupKey = parsed.data.token
    ? verifyOrderAccessToken(parsed.data.token)
    : null;
  if (!groupKey && parsed.data.orderId && !parsed.data.token) {
    const session = await auth();
    if (session?.user) {
      const order = await Order.findOne({
        _id: parsed.data.orderId,
        userId: session.user.id,
      });
      if (order) groupKey = orderGroupKey(order);
    }
  }
  if (!groupKey)
    return NextResponse.json(
      {
        error:
          "Use your private claim link or sign in to the account that placed the order",
      },
      { status: 403 },
    );
  try {
    const source = await Order.findOne(
      (await import("@/lib/orderAccess")).groupQuery(groupKey),
    );
    const host = new URL(parsed.data.targetLink).hostname.toLowerCase();
    if (new URL(parsed.data.targetLink).protocol !== "https:")
      throw new Error("Use an HTTPS public post URL");
    const domains: Record<string, string[]> = {
      instagram: ["instagram.com"],
      tiktok: ["tiktok.com"],
      facebook: ["facebook.com", "fb.watch"],
      twitter: ["x.com", "twitter.com"],
    };
    if (
      !source ||
      !(domains[source.platformId] || []).some(
        (domain) => host === domain || host.endsWith(`.${domain}`),
      )
    )
      throw new Error("Use a public post URL on the bonus platform");
    return NextResponse.json(
      await claimBonus(groupKey, parsed.data.targetLink),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not claim the bonus",
      },
      { status: 400 },
    );
  }
}
