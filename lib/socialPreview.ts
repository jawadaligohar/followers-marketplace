import { createHash } from "node:crypto";
import { Schema, model, models } from "mongoose";
import { dbConnect } from "@/lib/db/connect";
export function socialPreviewConfigured() {
  return Boolean(
    process.env.SOCIAL_FETCH_API_URL && process.env.SOCIAL_FETCH_API_KEY,
  );
}
const CacheSchema = new Schema(
  {
    key: { type: String, unique: true },
    value: Schema.Types.Mixed,
    expiresAt: { type: Date, expires: 0 },
  },
  { collection: "social_preview_cache" },
);
const LimitSchema = new Schema(
  {
    key: { type: String, unique: true },
    count: Number,
    expiresAt: { type: Date, expires: 0 },
  },
  { collection: "social_preview_limits" },
);
const Cache =
  models.SocialPreviewCache || model("SocialPreviewCache", CacheSchema);
const Limit =
  models.SocialPreviewLimit || model("SocialPreviewLimit", LimitSchema);
export type PreviewPost = { url: string; title: string };
const DOMAINS: Record<string, string[]> = {
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  twitter: ["twitter.com", "x.com"],
};
export function safePostUrl(value: unknown, platform: string) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      DOMAINS[platform]?.some(
        (domain) =>
          url.hostname === domain || url.hostname.endsWith(`.${domain}`),
      )
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function normalizePreviewPosts(
  data: unknown,
  platform: string,
): PreviewPost[] {
  const record =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const entries = Array.isArray(data)
    ? data
    : [record.posts, record.items, record.videos].find(Array.isArray) || [];
  const posts: PreviewPost[] = [];
  for (const entry of entries.slice(0, 30)) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const url = safePostUrl(
      item.url || item.post_url || item.web_url || item.permalink,
      platform,
    );
    if (url && !posts.some((post) => post.url === url))
      posts.push({
        url,
        title: String(item.caption || item.title || "Public post").slice(
          0,
          160,
        ),
      });
  }
  return posts;
}
export async function fetchSocialPreview(
  platform: string,
  username: string,
  requestIdentity: string,
) {
  if (!socialPreviewConfigured())
    throw new Error(
      "Profile preview is not configured. Paste the public post URL instead.",
    );
  const base = new URL(process.env.SOCIAL_FETCH_API_URL!);
  if (
    base.protocol !== "https:" &&
    !(
      ["localhost", "127.0.0.1"].includes(base.hostname) &&
      base.protocol === "http:"
    )
  )
    throw new Error("Configure an HTTPS profile service");
  if (
    base.hostname === "megafollowers.uk" ||
    base.hostname.endsWith(".megafollowers.uk")
  )
    throw new Error("Configure your own profile service");
  await dbConnect();
  await Promise.all([Cache.init(), Limit.init()]);
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const identity = createHash("sha256").update(requestIdentity).digest("hex");
  for (const [key, max] of [
    [`ip:${identity}:${minute}`, 5],
    [`global:${minute}`, 30],
  ] as const) {
    const bucket = await Limit.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(now + 120000) },
      },
      { upsert: true, returnDocument: "after" },
    );
    if (bucket.count > max)
      throw new Error("Too many previews. Please try again in a minute.");
  }
  const key = `${platform}:${username}`;
  const cached = await Cache.findOne({ key, expiresAt: { $gt: new Date() } });
  if (cached) return cached.value as PreviewPost[];
  const url = new URL(
    `api/v1/${platform}/${encodeURIComponent(username)}?type=posts`,
    base.href.endsWith("/") ? base.href : base.href + "/",
  );
  const response = await fetch(url, {
    headers: { "X-API-Key": process.env.SOCIAL_FETCH_API_KEY! },
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      "Profile preview is unavailable. Paste the public post URL instead.",
    );
  const result = await response.json();
  if (!result.success)
    throw new Error(
      "No public posts were found. Paste the public post URL instead.",
    );
  const posts = normalizePreviewPosts(result.data, platform);
  await Cache.findOneAndUpdate(
    { key },
    { $set: { value: posts, expiresAt: new Date(now + 300000) } },
    { upsert: true },
  );
  return posts;
}
