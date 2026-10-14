import { NextResponse } from "next/server";
import { clientIdentity, consumeLimit } from "./rateLimit";

export class RequestSecurityError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function trustedAppOrigin(request?: Request) {
  const configured = process.env.APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!configured && process.env.NODE_ENV === "production")
    throw new RequestSecurityError("Application URL is not configured", 503);
  const url = new URL(configured || request?.url || "http://localhost:3000");
  if (
    url.username ||
    url.password ||
    (process.env.NODE_ENV === "production" &&
      url.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(url.hostname))
  )
    throw new RequestSecurityError("Configure an HTTPS application URL", 503);
  return url.origin;
}

export function checkRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new RequestSecurityError("Cross-site requests are not allowed", 403);
  if (origin && origin !== trustedAppOrigin(request))
    throw new RequestSecurityError("Request origin is not allowed", 403);
}

export async function readLimitedBody(
  request: Request,
  maxBytes = 1024 * 1024,
) {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes))
    throw new RequestSecurityError("Request body is too large", 413);
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > maxBytes) {
      await reader.cancel();
      throw new RequestSecurityError("Request body is too large", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Route-local guards remain effective even when Proxy is bypassed. Webhook
 * authenticity stays in the processor handlers and is never replaced by CSRF. */
export function secureRoute<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    try {
      const path = new URL(request.url).pathname;
      const webhook = [
        "/api/stripe/webhook",
        "/api/webhooks/nowpayments",
        "/api/webhooks/nowpayments-order",
        "/api/webhooks/nowpayments-cart",
      ].includes(path);
      const unsafe = !["GET", "HEAD", "OPTIONS"].includes(request.method);
      if (unsafe) {
        if (!webhook) checkRequestOrigin(request);
        const body = await readLimitedBody(
          request,
          /\/auth\//.test(path) ? 16384 : 1024 * 1024,
        );
        if (
          !webhook &&
          body &&
          request.headers.get("content-type")?.split(";")[0].trim() !==
            "application/json"
        )
          throw new RequestSecurityError("Use application/json", 415);
        request = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body,
          signal: request.signal,
        });
      }
      if (!webhook) {
        const restricted = /\/auth\//.test(path);
        const scope = path.replace(/\/[a-f\d]{24}(?=\/|$)/gi, "/:id");
        const max = restricted
          ? path.endsWith("/signup")
            ? 10
            : 30
          : ["/api/checkout", "/api/orders", "/api/wallet/topup"].includes(
                path,
              ) && unsafe
            ? 20
            : 120;
        const rate = await consumeLimit(
          scope,
          clientIdentity(request),
          max,
          restricted ? 15 * 60000 : 60000,
        );
        if (!rate.allowed)
          return NextResponse.json(
            { error: "Too many requests. Try again later." },
            {
              status: 429,
              headers: {
                "Retry-After": String(rate.retryAfter),
                "Cache-Control": "no-store",
              },
            },
          );
      }
      const response = await handler(request, ...args);
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    } catch (error) {
      if (error instanceof RequestSecurityError)
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      console.error("API request failed", {
        path: new URL(request.url).pathname,
        name: error instanceof Error ? error.name : "UnknownError",
      });
      return NextResponse.json(
        { error: "Unable to complete this request" },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
