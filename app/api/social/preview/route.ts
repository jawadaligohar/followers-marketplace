import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIdentity } from "@/lib/security/rateLimit";
import {
  fetchSocialPreview,
  socialPreviewConfigured,
} from "@/lib/socialPreview";
const schema = z.object({
  platform: z.enum(["instagram", "tiktok", "twitter"]),
  username: z
    .string()
    .trim()
    .max(31)
    .transform((value) => value.replace(/^@/, "")),
});
async function getHandler() {
  return NextResponse.json({ enabled: socialPreviewConfigured() });
}
async function postHandler(request: Request) {
  const data = schema.safeParse(await request.json().catch(() => null));
  if (!data.success)
    return NextResponse.json(
      { error: "Enter a valid platform and username" },
      { status: 400 },
    );
  const { platform, username } = data.data;
  const pattern =
    platform === "twitter"
      ? /^[a-z\d_]{1,15}$/i
      : platform === "tiktok"
        ? /^[a-z\d._]{2,24}$/i
        : /^[a-z\d._]{1,30}$/i;
  if (!pattern.test(username))
    return NextResponse.json(
      { error: "Enter a valid username" },
      { status: 400 },
    );
  if (!socialPreviewConfigured())
    return NextResponse.json(
      { error: "Profile previews are not configured" },
      { status: 503 },
    );
  try {
    return NextResponse.json({
      posts: await fetchSocialPreview(
        platform,
        username,
        clientIdentity(request),
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Profile preview is unavailable",
      },
      { status: 400 },
    );
  }
}

export const GET = secureRoute(getHandler);
export const POST = secureRoute(postHandler);
