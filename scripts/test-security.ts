import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { encode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { nowpayments } from "../lib/nowpayments";
import { dbConnect } from "../lib/db/connect";
import { User } from "../lib/db/models/User";
import { Order } from "../lib/db/models/Order";
import { Transaction } from "../lib/db/models/Transaction";
import { CryptoInvoice } from "../lib/db/models/CryptoInvoice";
import { consumeLimit, clientIdentity } from "../lib/security/rateLimit";
import {
  checkRequestOrigin,
  readLimitedBody,
  secureRoute,
  trustedAppOrigin,
} from "../lib/security/request";
import {
  issuePasswordReset,
  consumePasswordReset,
  tokenDigest,
} from "../lib/security/passwordReset";
import { normalizeSocialTarget } from "../lib/security/socialTarget";
import { validateCryptoPayment } from "../lib/security/cryptoPayment";
import { customerOrder } from "../lib/security/customerOrder";
import { signupSchema } from "../lib/validation/auth";
import { checkoutSchema } from "../lib/validation/checkout";
import { safeCallbackPath } from "../lib/security/redirect";
import { applyWalletTransaction } from "../lib/wallet";
import { Service } from "../lib/db/models/Service";

const AUTH_SECRET = "isolated-security-test-secret-at-least-32-bytes";
const IPN_SECRET = "isolated-security-ipn-secret";
async function main() {
  if (
    !/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/followers_security_test(?:\?|$)/.test(
      process.env.MONGODB_URI || "",
    )
  )
    throw new Error("Use only the local followers_security_test database");
  const base = process.env.SECURITY_TEST_URL || "http://127.0.0.1:3031";
  if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
    throw new Error("HTTP security checks require a loopback test server");
  process.env.AUTH_SECRET = AUTH_SECRET;
  process.env.NEXTAUTH_SECRET = AUTH_SECRET;
  process.env.NEXT_PUBLIC_APP_URL = base;
  process.env.NEXTAUTH_URL = base;
  delete process.env.SECURITY_CLIENT_IP_HEADER;
  await dbConnect();
  await mongoose.connection.dropDatabase();
  await Promise.all([
    User.createIndexes(),
    Transaction.createIndexes(),
    CryptoInvoice.createIndexes(),
  ]);
  await mongoose.connection
    .collection("security_rate_limits")
    .createIndex({ key: 1 }, { unique: true });
  try {
    process.env.NOWPAYMENTS_IPN_SECRET = "";
    assert.equal(
      nowpayments.verifySignature({ payment_status: "finished" }, "anything"),
      false,
    );
    process.env.NOWPAYMENTS_IPN_SECRET = IPN_SECRET;
    const sign = (body: object) =>
      createHmac("sha512", IPN_SECRET)
        .update(
          JSON.stringify(
            Object.fromEntries(
              Object.entries(body).sort(([a], [b]) => a.localeCompare(b)),
            ),
          ),
        )
        .digest("hex");
    const payload = {
      order_id: "topup_security",
      invoice_id: 1001,
      payment_id: 2001,
      payment_status: "finished",
      price_currency: "usd",
      price_amount: 10,
      pay_amount: 10,
      actually_paid: 10,
    };
    assert.equal(nowpayments.verifySignature(payload, sign(payload)), true);
    assert.equal(
      nowpayments.verifySignature(
        { ...payload, price_amount: 100 },
        sign(payload),
      ),
      false,
    );
    assert.equal(nowpayments.verifySignature(payload, "x".repeat(128)), false);
    assert.equal(
      clientIdentity(
        new Request(base, {
          headers: { "x-forwarded-for": "attacker-controlled" },
        }),
      ),
      "unattributed",
    );
    assert.throws(
      () =>
        checkRequestOrigin(
          new Request(base, { headers: { origin: "https://evil.invalid" } }),
        ),
      /origin/,
    );
    assert.throws(
      () =>
        checkRequestOrigin(
          new Request(base, { headers: { "sec-fetch-site": "cross-site" } }),
        ),
      /Cross-site/,
    );
    checkRequestOrigin(new Request(base, { headers: { origin: base } }));
    assert.equal(trustedAppOrigin(new Request("https://evil.invalid")), base);
    await assert.rejects(
      readLimitedBody(new Request(base, { method: "POST", body: "12345" }), 4),
      /large/,
    );
    const guarded = secureRoute(async () => Response.json({ ok: true }));
    assert.equal(
      (
        await guarded(
          new Request(base + "/api/checkout", {
            method: "POST",
            headers: { origin: "https://evil.invalid" },
          }),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await guarded(
          new Request(base + "/api/checkout", {
            method: "POST",
            body: "test",
            headers: { "content-type": "text/plain" },
          }),
        )
      ).status,
      415,
    );
    assert.equal(
      (
        await guarded(
          new Request(base + "/api/checkout", {
            method: "POST",
            body: "{}",
            headers: { "content-type": "application/json", origin: base },
          }),
        )
      ).status,
      200,
    );
    const limits = await Promise.all(
      Array.from({ length: 20 }, () =>
        consumeLimit("security-concurrency", "same", 5, 60000),
      ),
    );
    assert.equal(limits.filter((limit) => limit.allowed).length, 5);
    for (const link of [
      "javascript:alert(1)",
      "data:text/html,test",
      "https://instagram.com.evil.invalid/x",
      "http://instagram.com/x",
      "https://user:pass@instagram.com/x",
      "https://127.0.0.1/x",
    ])
      assert.throws(() => normalizeSocialTarget(link, "instagram", "post"));
    assert.equal(
      normalizeSocialTarget("@example", "instagram", "profile"),
      "https://instagram.com/example",
    );
    for (const redirect of [
      "//evil.invalid",
      "/\\evil.invalid",
      "https://evil.invalid",
      "/\nevil.invalid",
    ])
      assert.equal(safeCallbackPath(redirect), "/dashboard");
    assert.equal(
      signupSchema.safeParse({
        name: "Customer",
        email: { $ne: null },
        password: "password123",
      }).success,
      false,
    );
    assert.equal(
      signupSchema.safeParse({
        name: "Customer",
        email: "test@example.com",
        password: "é".repeat(40),
      }).success,
      false,
    );
    assert.equal(
      checkoutSchema.safeParse({
        items: Array.from({ length: 21 }, () => ({
          serviceId: new mongoose.Types.ObjectId().toHexString(),
          qtyValue: 100,
          targetLink: "https://instagram.com/test",
        })),
        paymentSource: "card",
        guestEmail: "test@example.com",
      }).success,
      false,
    );

    const customer = await User.create({
      name: "Security customer",
      email: "customer@security.invalid",
      passwordHash: await bcrypt.hash("security-password", 10),
      walletBalanceCents: 0,
    });
    const admin = await User.create({
      name: "Security admin",
      email: "admin@security.invalid",
      role: "admin",
    });
    const own = await Order.create({
      userId: customer._id,
      serviceId: new mongoose.Types.ObjectId(),
      platformId: "instagram",
      platformLabel: "Instagram",
      category: "Likes",
      qtyValue: 100,
      targetLink: "https://instagram.com/p/test",
      priceCents: 1000,
      paymentSource: "card",
      status: "processing",
      supplierOrderId: "must-not-leak-supplier",
      stripePaymentIntentId: "must-not-leak-processor",
      failureReason: "must-not-leak-reason",
    });
    await Order.create({
      ...own.toObject(),
      _id: new mongoose.Types.ObjectId(),
      userId: admin._id,
    });
    const guest = await Order.create({
      ...own.toObject(),
      _id: new mongoose.Types.ObjectId(),
      userId: null,
      guestEmail: "guest@security.invalid",
    });
    const publicData = JSON.stringify(customerOrder(own));
    assert.ok(!publicData.includes("must-not-leak"));
    await assert.rejects(
      applyWalletTransaction({
        userId: customer._id,
        type: "topup",
        amountCents: NaN,
      }),
      /amount/,
    );
    await assert.rejects(
      applyWalletTransaction({
        userId: customer._id,
        type: "topup",
        amountCents: -100,
      }),
      /amount/,
    );
    await CryptoInvoice.create({
      orderId: payload.order_id,
      invoiceId: String(payload.invoice_id),
      amountCents: 1000,
      userId: customer._id,
    });
    await assert.rejects(
      validateCryptoPayment({ ...payload, price_currency: "eur" }),
      /USD/,
    );
    await assert.rejects(
      validateCryptoPayment({ ...payload, price_amount: 100 }),
      /match/,
    );
    await assert.rejects(
      validateCryptoPayment({ ...payload, actually_paid: 1 }),
      /incomplete/,
    );
    await validateCryptoPayment(payload, 1000);
    await assert.rejects(
      validateCryptoPayment({ ...payload, payment_id: 3001 }),
      /different payment/,
    );

    const cookieFor = async (id: string, role = "customer", version = 0) =>
      `authjs.session-token=${await encode({ secret: AUTH_SECRET, salt: "authjs.session-token", token: { id, role, sessionVersion: version } })}`;
    const cookie = await cookieFor(String(customer._id));
    let loginCookie = "";
    const request = (url: string, init?: RequestInit) =>
      fetch(base + url, { ...init, redirect: "manual" });
    if (process.env.SECURITY_TEST_URL) {
      const state = await (await request("/api/testing/status")).json();
      assert.equal(state.database, "followers_security_test");
      const csrf = await request("/api/auth/csrf");
      const csrfData = await csrf.json();
      const csrfCookie = csrf.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const login = await request("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: csrfCookie,
        },
        body: new URLSearchParams({
          csrfToken: csrfData.csrfToken,
          email: customer.email,
          password: "security-password",
          callbackUrl: base + "/dashboard",
        }).toString(),
      });
      loginCookie = login.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .filter((value) => value.startsWith("authjs.session-token="))
        .join("; ");
      assert.ok(
        loginCookie,
        "Real credential login must issue a session cookie",
      );
      assert.equal(
        (await request("/api/orders", { headers: { cookie: loginCookie } }))
          .status,
        200,
      );
      assert.equal((await request("/api/orders")).status, 401);
      assert.equal((await request("/api/admin/users")).status, 403);
      assert.equal(
        (
          await request("/api/admin/users", {
            headers: { cookie: await cookieFor(String(customer._id), "admin") },
          })
        ).status,
        403,
      );
      const ownResponse = await request("/api/orders", { headers: { cookie } });
      assert.equal(ownResponse.status, 200);
      const ownData = await ownResponse.json();
      assert.equal(ownData.orders.length, 1);
      assert.ok(!JSON.stringify(ownData).includes("must-not-leak"));
      const guestLookup = await request("/api/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: String(guest._id),
          email: guest.guestEmail,
        }),
      });
      const guestData = await guestLookup.json();
      assert.equal(guestData.verificationRequired, true);
      assert.equal(guestData.orders, undefined);
      assert.equal(
        (
          await request("/api/rewards", {
            method: "POST",
            headers: {
              cookie,
              origin: "https://evil.invalid",
              "content-type": "application/json",
            },
            body: "{}",
          })
        ).status,
        403,
      );
      const rejected = await request("/api/webhooks/nowpayments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-nowpayments-sig": "fake",
        },
        body: JSON.stringify(payload),
      });
      assert.equal(rejected.status, 401);
      const bad = { ...payload, price_amount: 999 };
      assert.notEqual(
        (
          await request("/api/webhooks/nowpayments", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-nowpayments-sig": sign(bad),
            },
            body: JSON.stringify(bad),
          })
        ).status,
        200,
      );
      assert.equal((await User.findById(customer._id)).walletBalanceCents, 0);
      const replayResponses = await Promise.all(
        Array.from({ length: 3 }, () =>
          request("/api/webhooks/nowpayments", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "x-nowpayments-sig": sign(payload),
            },
            body: JSON.stringify(payload),
          }),
        ),
      );
      assert.ok(replayResponses.every(response => response.status === 200));
      assert.equal(
        (await User.findById(customer._id)).walletBalanceCents,
        1000,
      );
      assert.equal(
        await Transaction.countDocuments({
          nowpaymentsPaymentId: String(payload.payment_id),
        }),
        1,
      );
      const service = await Service.create({
        slug: "instagram-likes",
        platformId: "instagram",
        platformLabel: "Instagram",
        category: "Likes",
        kind: "standard",
        target: "post",
        active: true,
        tiers: [{ qty: "100", qtyValue: 100, priceCents: 100 }],
      });
      const checkout = {
        serviceId: String(service._id),
        qtyValue: 100,
        targetLink: "https://instagram.com/p/test",
        paymentSource: "wallet",
        priceCents: 0,
      };
      const mismatch = await request("/api/orders", {
        method: "POST",
        headers: { cookie, "content-type": "application/json", origin: base },
        body: JSON.stringify({ ...checkout, expectedTotalCents: 1 }),
      });
      assert.equal(mismatch.status, 409);
      const purchase = await request("/api/orders", {
        method: "POST",
        headers: { cookie, "content-type": "application/json", origin: base },
        body: JSON.stringify(checkout),
      });
      assert.equal(purchase.status, 200);
      assert.equal((await purchase.json()).order.priceCents, 95);
      assert.equal((await User.findById(customer._id)).walletBalanceCents, 905);
      const purchased = await Order.findOne({
        userId: customer._id,
        serviceId: service._id,
      });
      assert.ok(purchased.paymentConfirmedAt);
      assert.equal(purchased.status, "processing");
      const page = await request("/");
      assert.equal(page.status, 200);
      const csp = page.headers.get("content-security-policy") || "";
      assert.ok(csp.includes("'strict-dynamic'"));
      assert.ok(!csp.includes("unsafe-eval"));
      const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
      assert.ok(nonce && (await page.text()).includes(`nonce="${nonce}"`));
      assert.notEqual(
        (await request("/")).headers.get("content-security-policy"),
        csp,
      );
      assert.equal(page.headers.get("x-frame-options"), "DENY");
      assert.equal(page.headers.get("referrer-policy"), "no-referrer");
      const rsc = await request("/admin", {
        headers: {
          cookie,
          RSC: "1",
          "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy",
        },
      });
      assert.ok(!(await rsc.text()).includes(admin.email));
    }
    const token = await issuePasswordReset(String(customer._id));
    const resetUser = await User.findById(customer._id).select(
      "+resetPasswordToken",
    );
    assert.equal(resetUser.resetPasswordToken, tokenDigest(token));
    assert.notEqual(resetUser.resetPasswordToken, token);
    const resetResults = await Promise.all([
      consumePasswordReset(token, "new-secure-password-1"),
      consumePasswordReset(token, "new-secure-password-2"),
    ]);
    assert.equal(resetResults.filter(Boolean).length, 1);
    assert.equal((await User.findById(customer._id)).sessionVersion, 1);
    assert.equal((await User.findById(customer._id)).passwordHash, undefined);
    if (process.env.SECURITY_TEST_URL)
      assert.equal(
        (await fetch(base + "/api/orders", { headers: { cookie } })).status,
        401,
      );
    if (loginCookie)
      assert.equal(
        (
          await fetch(base + "/api/orders", {
            headers: { cookie: loginCookie },
          })
        ).status,
        401,
      );
    const scan = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) scan(file);
        else if (entry.name === "route.ts" && !file.includes("[...nextauth]"))
          assert.ok(
            readFileSync(file, "utf8").includes("secureRoute"),
            `${file}: missing security wrapper`,
          );
      }
    };
    scan("app/api");
    console.log(
      "PASS: fail-closed signatures, exact crypto invoice binding, underpayment/replay rejection, atomic wallet credit, shared throttles, origin/body guards, social URL safety, private DTOs, hashed one-use resets, session revocation, API authorization and production CSP.",
    );
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
