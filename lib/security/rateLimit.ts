import { createHash } from "node:crypto";
import { Schema, model, models } from "mongoose";
import { dbConnect } from "@/lib/db/connect";

const schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { collection: "security_rate_limits" },
);
const Bucket = models.SecurityRateLimit || model("SecurityRateLimit", schema);

/** Configure only a header your ingress overwrites; client-supplied forwarding
 * headers are deliberately ignored by default. Shared counters survive restarts. */
export function clientIdentity(request: Request) {
  const header = process.env.SECURITY_CLIENT_IP_HEADER?.toLowerCase();
  if (
    !header ||
    !["x-forwarded-for", "x-real-ip", "cf-connecting-ip"].includes(header)
  )
    return "unattributed";
  return (
    request.headers.get(header)?.split(",")[0]?.trim().slice(0, 100) ||
    "unattributed"
  );
}

export async function consumeLimit(
  scope: string,
  identity: string,
  max: number,
  windowMs: number,
) {
  await dbConnect();
  await Bucket.init();
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const key = createHash("sha256")
    .update(`${scope}:${identity}:${window}`)
    .digest("hex");
  let bucket;
  try {
    bucket = await Bucket.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((window + 1) * windowMs) },
      },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if (!(
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ))
      throw error;
    bucket = await Bucket.findOneAndUpdate(
      { key },
      { $inc: { count: 1 } },
      { returnDocument: "after" },
    );
  }
  return {
    allowed: Boolean(bucket && bucket.count <= max),
    retryAfter: Math.max(1, Math.ceil(((window + 1) * windowMs - now) / 1000)),
  };
}
