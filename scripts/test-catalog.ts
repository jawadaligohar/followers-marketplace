import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import mongoose from "mongoose";
import { CATALOG, GBP_TO_USD } from "../lib/catalog";
import { dbConnect } from "../lib/db/connect";
import { Service } from "../lib/db/models/Service";
import { Order } from "../lib/db/models/Order";
import { resolveLine, LineItemError } from "../lib/orderLine";
import { fulfillOrder } from "../lib/supplier/fulfillment";
import { checkoutSchema } from "../lib/validation/checkout";
import { serviceUpdateSchema } from "../lib/validation/service";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (
    !uri ||
    !/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/followers_catalog_test(?:\?|$)/.test(
      uri,
    )
  ) {
    throw new Error(
      "Set MONGODB_URI to a local followers_catalog_test database. This test never runs against Atlas.",
    );
  }
  process.env.PEAKERR_SANDBOX = "true";
  process.env.SMM_DISPATCH_ENABLED = "true";
  await dbConnect();
  await mongoose.connection.dropDatabase();
  try {
    // A legacy document must keep its ID, activity setting and supplier mapping.
    const legacy = await Service.collection.insertOne({
      platformId: "instagram",
      platformLabel: "Instagram",
      category: "Followers",
      supplierServiceId: "1001",
      active: false,
      tiers: [],
    });
    function seed() {
      execFileSync(
        process.execPath,
        ["--import", "tsx", "scripts/seed.ts", "--services-only"],
        {
          env: {
            ...process.env,
            SEED_ADMIN_EMAIL: "",
            SEED_ADMIN_PASSWORD: "",
          },
          stdio: "pipe",
        },
      );
    }
    seed();
    const mapped = await Service.findOne({ slug: "tiktok-likes" });
    mapped.defaultProvider = "jap";
    mapped.providerMappings = { jap: "711" };
    mapped.tiers[0].defaultProvider = "tiksta";
    mapped.tiers[0].providerMappings = { tiksta: "812" };
    await mapped.save();
    seed();
    const preserved = await Service.findById(mapped._id);
    assert.equal(preserved.defaultProvider, "jap");
    assert.equal(preserved.providerMappings.jap, "711");
    assert.equal(preserved.tiers[0].providerMappings.tiksta, "812");
    const migrated = await Service.findById(legacy.insertedId).lean();
    assert.equal(migrated.slug, "instagram-followers");
    assert.equal(migrated.supplierServiceId, "1001");
    assert.equal(migrated.active, false);
    await Service.updateOne({ _id: legacy.insertedId }, { active: true });
    const all = await Service.find({}).lean();
    assert.equal(all.length, 34);
    let packages = 0;
    for (const copy of CATALOG) {
      const service = all.find((s) => s.slug === copy.slug)!;
      assert.equal(service.kind, copy.kind);
      assert.equal(service.target, copy.target);
      assert.equal(service.tiers.length, copy.tiers.length);
      for (const tier of copy.tiers) {
        packages++;
        const saved = service.tiers.find(
          (t: { qtyValue: number }) => t.qtyValue === tier.qty,
        );
        assert.equal(saved.priceCents, Math.round(tier.gbp * GBP_TO_USD * 100));
        for (const [posts, price] of Object.entries(tier.posts ?? {})) {
          assert.equal(
            saved.postsOptions.find(
              (o: { posts: number }) => o.posts === Number(posts),
            ).priceCents,
            Math.round((tier.gbp + price) * GBP_TO_USD * 100) -
              Math.round(tier.gbp * GBP_TO_USD * 100),
          );
        }
      }
    }
    assert.equal(packages, 219);
    const get = (slug: string) => all.find((s) => s.slug === slug)!;
    const item = (slug: string, qtyValue: number) => ({
      serviceId: String(get(slug)._id),
      qtyValue,
      targetLink: `https://${get(slug).platformId === "twitter" ? "x.com" : get(slug).platformId + ".com"}/example`,
    });
    const normal = await resolveLine(item("instagram-likes", 5000), "card");
    const wallet = await resolveLine(item("instagram-likes", 5000), "wallet");
    assert.equal(wallet.chargeCents, Math.round(normal.chargeCents * 0.95));
    const auto = await resolveLine(
      { ...item("instagram-auto-likes", 1000), postsCovered: 90 },
      "card",
    );
    assert.equal(
      auto.fullPriceCents,
      Math.round(72.99 * GBP_TO_USD * 100) + Math.round(160 * GBP_TO_USD * 100),
    );
    const comments = await resolveLine(
      {
        ...item("instagram-comments", 10),
        comments: Array.from({ length: 10 }, (_, i) => ` Comment ${i + 1} `),
      },
      "card",
    );
    assert.equal(comments.orderFields.comments[0], "Comment 1");
    const poll = await resolveLine(
      { ...item("twitter-votes", 500), pollOption: 3 },
      "card",
    );
    for (const invalid of [
      { ...item("instagram-uk-likes", 5000) },
      { ...item("instagram-likes", 123) },
      { ...item("instagram-auto-likes", 1000), postsCovered: 45 },
      { ...item("instagram-comments", 10), comments: [" "] },
      { ...item("twitter-votes", 500), pollOption: 5 },
    ])
      await assert.rejects(resolveLine(invalid, "card"), LineItemError);
    assert.equal(
      checkoutSchema.safeParse({
        items: [{ serviceId: "bad", qtyValue: 10, targetLink: "  " }],
        paymentSource: "card",
        guestEmail: "guest@example.com",
      }).success,
      false,
    );
    assert.deepEqual(serviceUpdateSchema.parse({ category: "Likes" }), {
      category: "Likes",
    });
    for (const line of [auto, comments, poll]) {
      await Service.updateOne(
        { _id: line.service._id },
        { supplierServiceId: "9001" },
      );
      const order = await Order.create({
        ...line.orderFields,
        status: "pending",
        paymentSource: "card",
        paymentConfirmedAt: new Date(),
      });
      const result = await fulfillOrder(order);
      assert.equal(result.success, true);
      assert.equal(result.mode, "automated");
      const saved = await Order.findById(order._id);
      assert.equal(saved.postsCovered, line.orderFields.postsCovered);
      assert.equal(saved.pollOption, line.orderFields.pollOption);
      assert.deepEqual([...saved.comments], line.orderFields.comments);
    }
    console.log(
      "PASS: 34 services, 219 USD prices, auto upgrades, legacy migration, seed idempotence, validation, wallet pricing, and sandbox fulfillment.",
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
