import assert from "node:assert/strict";
import mongoose from "mongoose";
import { dbConnect } from "../lib/db/connect";
import { Service } from "../lib/db/models/Service";
import { Order } from "../lib/db/models/Order";
import { fulfillOrder } from "../lib/supplier/fulfillment";
import { resolveProviderMapping, PROVIDERS } from "../lib/supplier/providers";
import { supplierOrderAction } from "../lib/supplier/orderActions";
import {
  requestMerchantRefill,
  completeMerchantRefill,
} from "../lib/supplier/merchantRefill";
import {
  serviceSchema,
  validProviderPlatform,
} from "../lib/validation/service";
import { getProviderClient } from "../lib/supplier";
import {
  normalizePreviewPosts,
  safePostUrl,
  fetchSocialPreview,
} from "../lib/socialPreview";

async function main() {
  process.env.SMM_DISPATCH_ENABLED = "true";
  if (
    !/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/followers_suppliers_test(?:\?|$)/.test(
      process.env.MONGODB_URI || "",
    )
  )
    throw new Error("Use only the local followers_suppliers_test database");
  for (const provider of PROVIDERS) {
    process.env[`${provider.toUpperCase()}_SANDBOX`] = "false";
    process.env[`${provider.toUpperCase()}_API_KEY`] = "local-test-key";
    delete process.env[`${provider.toUpperCase()}_API_BASE`];
  }
  await dbConnect();
  await mongoose.connection.dropDatabase();
  const originalFetch = globalThis.fetch;
  const calls: {
    endpoint: string;
    action: string;
    service: string | null;
    order: string | null;
    link: string | null;
    posts: string | null;
    username: string | null;
  }[] = [];
  let behavior = "ok";
  globalThis.fetch = async (input, options) => {
    const body = new URLSearchParams(String(options?.body));
    calls.push({
      endpoint: String(input),
      action: body.get("action")!,
      service: body.get("service"),
      order: body.get("order") || body.get("orders"),
      link: body.get("link"),
      posts: body.get("posts"),
      username: body.get("username"),
    });
    if (behavior === "timeout")
      throw new Error("Simulated ambiguous connection failure");
    if (behavior === "reject")
      return Response.json({ error: "Insufficient funds" });
    switch (body.get("action")) {
      case "add":
        return Response.json({ order: `order-${calls.length}` });
      case "status":
        return Response.json({ status: "Completed", remains: "0" });
      case "refill":
        return Response.json({ refill: "refill-1" });
      case "cancel":
        return Response.json([{ cancel: 1 }]);
      case "refill_status":
        return Response.json({ status: "Completed" });
      case "balance":
        return Response.json({ balance: "24.00", currency: "USD" });
      case "services":
        return Response.json([
          {
            service: "10265",
            type: "Subscriptions",
            min: "100",
            max: "30000000",
            rate: "0.055",
          },
          {
            service: "9015",
            type: "Default",
            min: "100",
            max: "20000",
            rate: "0.1",
          },
        ]);
      default:
        return Response.json([]);
    }
  };
  try {
    const service = await Service.create({
      slug: "tiktok-test",
      platformId: "tiktok",
      platformLabel: "TikTok",
      category: "Likes",
      defaultProvider: "jap",
      supplierServiceId: "10",
      providerMappings: { jap: "11", peakerr: "12", tiksta: "13" },
      tiers: [
        { qty: "100", qtyValue: 100, priceCents: 200 },
        {
          qty: "500",
          qtyValue: 500,
          priceCents: 600,
          defaultProvider: "tiksta",
          providerMappings: { tiksta: "99" },
        },
      ],
    });
    assert.deepEqual(resolveProviderMapping(service, 100), {
      provider: "jap",
      serviceId: "11",
    });
    assert.deepEqual(resolveProviderMapping(service, 500), {
      provider: "tiksta",
      serviceId: "99",
    });
    assert.deepEqual(
      resolveProviderMapping(
        { platformId: "instagram", supplierServiceId: "legacy" },
        100,
      ),
      { provider: "peakerr", serviceId: "legacy" },
    );
    assert.throws(() =>
      resolveProviderMapping(
        { platformId: "instagram", defaultProvider: "tiksta" },
        100,
      ),
    );
    assert.equal(
      validProviderPlatform({
        platformId: "instagram",
        tiers: [{ providerMappings: { tiksta: "1" } }],
      }),
      false,
    );
    assert.equal(
      serviceSchema.safeParse({
        ...service.toObject(),
        platformId: "instagram",
        defaultProvider: "tiksta",
      }).success,
      false,
    );
    const makeOrder = (qtyValue = 100, paid = true) =>
      Order.create({
        serviceId: service._id,
        platformId: "tiktok",
        platformLabel: "TikTok",
        category: "Likes",
        qtyValue,
        targetLink: "https://tiktok.com/@example/video/1",
        priceCents: 200,
        paymentSource: "card",
        status: "pending",
        paymentConfirmedAt: paid ? new Date() : null,
      });
    const unpaid = await makeOrder(100, false);
    assert.equal((await fulfillOrder(unpaid)).success, false);
    const paused = await Order.create({
      ...unpaid.toObject(),
      _id: new mongoose.Types.ObjectId(),
      paymentConfirmedAt: new Date(),
    });
    process.env.SMM_DISPATCH_ENABLED = "false";
    const callsBeforePause = calls.length;
    assert.equal((await fulfillOrder(paused)).mode, "manual");
    assert.equal(calls.length, callsBeforePause);
    assert.match((await Order.findById(paused._id))!.failureReason!, /paused/);
    process.env.SMM_DISPATCH_ENABLED = "true";
    assert.equal(calls.length, 0);
    for (const provider of PROVIDERS) {
      const order = await makeOrder();
      const result = await fulfillOrder(order, { provider });
      assert.equal(result.success, true);
      const saved = await Order.findById(order._id);
      assert.equal(saved.supplierProvider, provider);
      assert.equal(
        calls.at(-1)?.endpoint,
        provider === "jap"
          ? "https://justanotherpanel.com/api/v2"
          : `https://${provider}.com/api/v2`,
      );
      const count: number = calls.length;
      await fulfillOrder(String(order._id), { provider: "peakerr" });
      assert.equal(calls.length, count);
      await service.updateOne({ defaultProvider: "peakerr" });
      await supplierOrderAction(String(order._id), "sync");
      assert.equal((await Order.findById(order._id)).status, "completed");
      assert.equal(
        calls
          .at(-1)
          ?.endpoint.includes(
            provider === "jap" ? "justanotherpanel" : provider,
          ),
        true,
      );
      const results = await Promise.allSettled([
        supplierOrderAction(String(order._id), "refill"),
        supplierOrderAction(String(order._id), "refill"),
      ]);
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      await supplierOrderAction(String(order._id), "refillStatus");
    }
    await service.updateOne({ defaultProvider: "jap" });
    const tierOrder = await makeOrder(500);
    await fulfillOrder(tierOrder);
    assert.equal(
      (await Order.findById(tierOrder._id)).supplierServiceIdUsed,
      "99",
    );
    const duplicate = await makeOrder();
    const before = calls.length;
    await Promise.all([
      fulfillOrder(String(duplicate._id)),
      fulfillOrder(String(duplicate._id)),
    ]);
    assert.equal(calls.length - before, 1);
    behavior = "timeout";
    const unknown = await makeOrder();
    assert.equal((await fulfillOrder(unknown)).mode, "manual");
    const after = calls.length;
    await fulfillOrder(String(unknown._id), { provider: "peakerr" });
    assert.equal(calls.length, after);
    assert.equal(
      (await Order.findById(unknown._id)).supplierStatus,
      "dispatch_unknown",
    );
    behavior = "ok";
    await supplierOrderAction(String(unknown._id), "reconcile", {
      provider: "jap",
      supplierOrderId: "verified-existing",
    });
    assert.equal(
      (await Order.findById(unknown._id)).supplierOrderId,
      "verified-existing",
    );
    behavior = "reject";
    const rejected = await makeOrder();
    assert.equal((await fulfillOrder(rejected)).mode, "automated");
    assert.equal(
      (await Order.findById(rejected._id)).supplierStatus,
      "submission_error",
    );
    behavior = "ok";
    const pollService = await Service.create({
      slug: "twitter-votes",
      platformId: "twitter",
      platformLabel: "X",
      category: "Votes",
      kind: "poll",
      defaultProvider: "jap",
      providerMappings: { jap: "9015" },
    });
    const pollOrder = await Order.create({
      ...(await makeOrder()).toObject(),
      _id: new mongoose.Types.ObjectId(),
      serviceId: pollService._id,
      platformId: "twitter",
      targetLink: "https://x.com/example/status/1",
      serviceKind: "poll",
      pollOption: 2,
    });
    assert.equal((await fulfillOrder(pollOrder)).mode, "automated");
    assert.equal(calls.at(-1)?.action, "add");
    assert.equal(new URL(calls.at(-1)!.link!).searchParams.get("vote"), "2");
    delete process.env.JAP_API_KEY;
    const manual = await makeOrder();
    const initial = calls.length;
    assert.equal((await fulfillOrder(manual)).mode, "manual");
    assert.equal(calls.length, initial);
    process.env.JAP_API_KEY = "local-test-key";
    assert.equal((await getProviderClient("jap").getBalance()).balance, 24);
    const cancelled = await makeOrder();
    await fulfillOrder(cancelled);
    await supplierOrderAction(String(cancelled._id), "cancel");
    assert.equal(
      (await Order.findById(cancelled._id)).supplierStatus,
      "cancel_requested",
    );
    const nativeAutoService = await Service.create({
      slug: "tiktok-auto-views",
      platformId: "tiktok",
      platformLabel: "TikTok",
      category: "Auto Views",
      kind: "auto",
      defaultProvider: "jap",
      providerMappings: { jap: "10265" },
    });
    const nativeAuto = await Order.create({
      ...(await makeOrder()).toObject(),
      _id: new mongoose.Types.ObjectId(),
      serviceId: nativeAutoService._id,
      serviceKind: "auto",
      postsCovered: 120,
      targetLink: "https://tiktok.com/@example",
    });
    assert.equal((await fulfillOrder(nativeAuto)).mode, "automated");
    assert.equal(calls.at(-1)?.username, "example");
    assert.equal(calls.at(-1)?.posts, "120");
    assert.equal(calls.at(-1)?.link, null);
    await assert.rejects(
      requestMerchantRefill(
        String(nativeAuto._id),
        10,
        "Verified missing likes",
        "https://tiktok.com/@example",
      ),
      /specific public post/,
    );
    await requestMerchantRefill(
      String(nativeAuto._id),
      10,
      "Verified missing views on delivered post",
      "https://tiktok.com/@example/video/2",
    );
    assert.equal(
      (await Order.findById(nativeAuto._id)).merchantRefill.status,
      "requested",
    );

    const replacementParent = await makeOrder();
    await fulfillOrder(replacementParent);
    await supplierOrderAction(String(replacementParent._id), "sync");
    const parentId = String(replacementParent._id);
    await assert.rejects(
      requestMerchantRefill(parentId, 101, "Verified drop"),
      /quantity/,
    );
    const beforeReplacement = calls.filter(
      (call) => call.action === "add",
    ).length;
    const replacements = await Promise.allSettled([
      requestMerchantRefill(parentId, 10, "Count verified by support"),
      requestMerchantRefill(parentId, 10, "Count verified by support"),
    ]);
    assert.equal(
      replacements.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      calls.filter((call) => call.action === "add").length,
      beforeReplacement,
    );
    assert.equal(
      (await Order.findById(parentId)).merchantRefill.status,
      "requested",
    );
    await assert.rejects(
      supplierOrderAction(parentId, "refill"),
      /already pending/,
    );
    await assert.rejects(
      completeMerchantRefill(parentId, replacementParent.supplierOrderId!),
      /separate/,
    );
    await completeMerchantRefill(parentId, "staff-verified-replacement");
    assert.equal(
      (await Order.findById(parentId)).merchantRefill.status,
      "completed",
    );
    assert.equal(
      (await Order.findById(parentId)).supplierOrderId,
      replacementParent.supplierOrderId,
    );
    await assert.rejects(
      requestMerchantRefill(parentId, 91, "Another verified drop"),
      /Cumulative/,
    );
    await requestMerchantRefill(parentId, 20, "Another verified drop");
    assert.equal(
      (await Order.findById(parentId)).merchantRefillHistory.length,
      1,
    );
    await assert.rejects(
      completeMerchantRefill(parentId, "staff-verified-replacement"),
      /separate/,
    );
    await completeMerchantRefill(parentId, "staff-verified-replacement-2");
    assert.equal(
      calls.filter((call) => call.action === "add").length,
      beforeReplacement,
    );
    assert.equal(
      safePostUrl("https://instagram.com.evil.invalid/post/1", "instagram"),
      null,
    );
    assert.equal(safePostUrl("javascript:alert(1)", "instagram"), null);
    assert.deepEqual(
      normalizePreviewPosts(
        {
          posts: [
            { url: "https://instagram.com/p/1", caption: "Example" },
            { url: "https://bad.invalid/" },
            { url: "https://instagram.com/p/1" },
          ],
        },
        "instagram",
      ),
      [{ url: "https://instagram.com/p/1", title: "Example" }],
    );
    process.env.SOCIAL_FETCH_API_URL = "https://preview.example.invalid/";
    process.env.SOCIAL_FETCH_API_KEY = "local-preview-key";
    let previewRequests = 0;
    globalThis.fetch = async (url, options) => {
      assert.equal(
        String(url),
        "https://preview.example.invalid/api/v1/instagram/example?type=posts",
      );
      assert.equal(
        (options?.headers as Record<string, string>)["X-API-Key"],
        "local-preview-key",
      );
      previewRequests++;
      return Response.json({
        success: true,
        data: [{ url: "https://instagram.com/p/1" }],
      });
    };
    assert.equal(
      (await fetchSocialPreview("instagram", "example", "test-request")).length,
      1,
    );
    await fetchSocialPreview("instagram", "example", "test-request");
    assert.equal(previewRequests, 1);
    for (let i = 0; i < 3; i++)
      await fetchSocialPreview("instagram", "example", "test-request");
    await assert.rejects(
      fetchSocialPreview("instagram", "example", "test-request"),
      /Too many/,
    );
    process.env.SOCIAL_FETCH_API_URL = "https://social-api.megafollowers.uk/";
    await assert.rejects(
      fetchSocialPreview("instagram", "example", "another-request"),
      /your own/,
    );
    console.log(
      "PASS: JAP/Peakerr/Tiksta routing, package overrides, legacy fallback, TikTok restrictions, paid-only dispatch, concurrent dispatch/refill protection, unknown submissions, reconciliation, provider status, missing-key manual queue, profile preview contract, cache, and rate limits.",
    );
  } finally {
    globalThis.fetch = originalFetch;
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
