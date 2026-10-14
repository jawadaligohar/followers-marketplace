import { createHmac, timingSafeEqual } from "node:crypto";
import type { IOrder } from "@/lib/db/models/Order";

export function orderGroupKey(
  order: Pick<
    IOrder,
    "_id" | "checkoutGroupId" | "stripeSessionId" | "cryptoCheckoutId"
  >,
) {
  return (
    order.checkoutGroupId ||
    order.stripeSessionId ||
    order.cryptoCheckoutId ||
    `order_${order._id}`
  );
}
function signingSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Authentication secret is required");
  if (process.env.NODE_ENV === "production" && Buffer.byteLength(secret) < 32) throw new Error("Authentication secret must be at least 32 bytes");
  return secret;
}
export function orderAccessToken(groupKey: string) {
  const payload = Buffer.from(groupKey).toString("base64url");
  return `${payload}.${createHmac("sha256", signingSecret()).update(payload).digest("base64url")}`;
}
export function verifyOrderAccessToken(token: string): string | null {
  if (token.length > 512) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", signingSecret())
    .update(payload)
    .digest();
  const supplied = Buffer.from(signature, "base64url");
  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  )
    return null;
  return Buffer.from(payload, "base64url").toString();
}
export function groupQuery(groupKey: string) {
  if (/^order_[a-f\d]{24}$/i.test(groupKey)) return { _id: groupKey.slice(6) };
  return {
    $or: [
      { checkoutGroupId: groupKey },
      { stripeSessionId: groupKey },
      { cryptoCheckoutId: groupKey },
    ],
  };
}
