import assert from "node:assert/strict";
import mongoose from "mongoose";
import { dbConnect } from "../lib/db/connect";
import { User } from "../lib/db/models/User";
import { Order } from "../lib/db/models/Order";
import { Service } from "../lib/db/models/Service";
import { Transaction } from "../lib/db/models/Transaction";
import { BankTransfer, EmailOutbox } from "../lib/db/models/Benefits";
import {
  getAdminMetrics,
  getAdminOrders,
  getAdminUsers,
  pageNumber,
  searchRegex,
} from "../lib/adminQueries";
import { adminEmailActivity, adminTransactions } from "../lib/adminActivity";
import { sendMail } from "../lib/mailer";
async function main() {
  if (
    !/^mongodb:\/\/(localhost|127\.0\.0\.1):\d+\/followers_admin_test(?:\?|$)/.test(
      process.env.MONGODB_URI || "",
    )
  )
    throw new Error(
      "Use only the local followers_admin_test replica-set database",
    );
  process.env.RESEND_API_KEY = "";
  process.env.EMAIL_FROM = "";
  for (const provider of ["PEAKERR", "JAP", "TIKSTA"]) {
    process.env[`${provider}_API_KEY`] = "";
    process.env[`${provider}_SANDBOX`] = "false";
  }
  await dbConnect();
  await mongoose.connection.dropDatabase();
  const originalFetch = globalThis.fetch;
  try {
    const admin = await User.create({
      name: "Admin",
      email: "admin@example.invalid",
      role: "admin",
      walletBalanceCents: 1000,
      emailVerified: new Date(),
      passwordHash: "must-not-leak",
      resetPasswordToken: "must-not-leak-token",
    });
    const customer = await User.create({
      name: "Customer",
      email: "customer@example.invalid",
      walletBalanceCents: 500,
    });
    const service = await Service.create({
      slug: "test-likes",
      platformId: "instagram",
      platformLabel: "Instagram",
      category: "Likes",
      tiers: [
        { qty: "100", qtyValue: 100, priceCents: 100 },
        { qty: "500", qtyValue: 500, priceCents: 500 },
      ],
    });
    const base = {
      userId: customer._id,
      serviceId: service._id,
      platformId: "instagram",
      platformLabel: "Instagram",
      category: "Likes",
      qtyValue: 100,
      targetLink: "https://instagram.com/p/example",
      paymentSource: "card",
      status: "processing",
    };
    const paid = await Order.create({
      ...base,
      priceCents: 10000,
      refundedCents: 2000,
      paymentConfirmedAt: new Date(),
      customerEmail: customer.email,
      stripeSessionId: "cs_admin_test",
    });
    await Order.create({
      ...base,
      priceCents: 5000,
      paymentSource: "wallet",
      paymentConfirmedAt: new Date(),
      supplierStatus: "dispatch_unknown",
      supplierProvider: "jap",
    });
    await Order.create({ ...base, priceCents: 99999 });
    await Order.create({ ...base, priceCents: 88888, status: "completed" });
    await Order.create({
      ...base,
      priceCents: 0,
      paymentSource: "bonus",
      status: "pending",
    });
    await Order.create({
      ...base,
      priceCents: 2000,
      paymentSource: "crypto",
      paymentConfirmedAt: new Date(),
      status: "completed",
      userId: null,
      guestEmail: "guest@example.invalid",
    });
    await Order.create({
      ...base,
      priceCents: 1000,
      refundedCents: 1000,
      paymentSource: "bank",
      paymentConfirmedAt: new Date(),
      status: "cancelled",
    });
    await Order.create({ ...base, priceCents: 3000, status: "pending" });
    await Transaction.create({
      userId: customer._id,
      type: "topup",
      amountCents: 20000,
      balanceAfterCents: 20000,
      note: "Fixture topup",
    });
    await Transaction.create({
      userId: customer._id,
      type: "reward_credit",
      amountCents: 300,
      balanceAfterCents: 20300,
      note: "Fixture reward",
    });
    await BankTransfer.create({
      reference: "bank_fixture",
      userId: customer._id,
      email: customer.email,
      kind: "topup",
      amountCents: 5000,
    });
    await EmailOutbox.create({
      key: "verify:fixture",
      to: customer.email,
      subject: "Verify",
      text: "private-verification-link",
    });
    await EmailOutbox.create({
      key: "paid:fixture",
      to: customer.email,
      subject: "Paid",
      text: "private-order-link",
      status: "sent",
      sentAt: new Date(),
    });
    const metrics = await getAdminMetrics();
    assert.equal(metrics.sales.gross, 18000);
    assert.equal(metrics.sales.refunds, 3000);
    assert.equal(metrics.sales.net, 15000);
    assert.equal(metrics.sales.count, 4);
    assert.equal(metrics.sales.last30, 15000);
    assert.equal(metrics.orders.total, 8);
    assert.equal(metrics.orders.bonuses, 1);
    assert.equal(metrics.orders.guest, 1);
    assert.equal(metrics.users.total, 2);
    assert.equal(metrics.users.verified, 1);
    assert.equal(metrics.users.walletCents, 1500);
    assert.equal(metrics.manual, 2);
    assert.equal(metrics.uncertain, 1);
    assert.equal(metrics.awaiting, 1);
    assert.equal(metrics.services.unmappedPackages, 2);
    assert.equal(metrics.pendingBank.amountCents, 5000);
    assert.equal(
      metrics.daily.reduce((sum, row) => sum + row.amountCents, 0),
      15000,
    );
    assert.equal(
      metrics.ledger.find((row) => row._id === "topup")?.amountCents,
      20000,
    );
    const guest = await getAdminOrders({ q: "guest@example.invalid" });
    assert.equal(guest.total, 1);
    assert.equal(guest.rows[0].customerEmail, "guest@example.invalid");
    assert.equal((await getAdminOrders({ q: customer.email })).total, 7);
    assert.equal((await getAdminOrders({ queue: "manual" })).total, 2);
    assert.equal((await getAdminOrders({ queue: "attention" })).total, 1);
    assert.equal(
      (await getAdminOrders({ q: String(paid._id) })).rows[0].stripeSessionId,
      "cs_admin_test",
    );
    assert.equal((await getAdminOrders({ q: "[" })).total, 0);
    assert.equal(searchRegex("a+b").test("a+b"), true);
    assert.equal(pageNumber({ page: "NaN" }), 1);
    const users = await getAdminUsers({ q: customer.email });
    assert.equal(users.total, 1);
    assert.equal(users.rows[0].spentCents, 13000);
    assert.equal(users.rows[0].orderCount, 7);
    assert.equal(
      JSON.stringify(await getAdminUsers({})).includes("must-not-leak"),
      false,
    );
    assert.equal((await adminEmailActivity({ status: "pending" })).total, 1);
    assert.equal(
      JSON.stringify(await adminEmailActivity({})).includes(
        "private-order-link",
      ),
      false,
    );
    assert.equal((await adminTransactions({ type: "topup" })).total, 1);
    assert.equal((await adminTransactions({}, String(admin._id))).total, 0);
    await User.collection.insertOne({
      name: "OAuth legacy",
      email: "oauth@example.invalid",
      emailVerified: new Date(),
    });
    const legacyUser = await getAdminUsers({
      q: "oauth@example.invalid",
      role: "customer",
    });
    assert.equal(legacyUser.total, 1);
    assert.equal(legacyUser.rows[0].createdAt, null);
    for (let i = 0; i < 26; i++)
      await User.create({
        name: `Page User ${i}`,
        email: `page${i}@example.invalid`,
      });
    const page1 = await getAdminUsers({ q: "page" });
    const page2 = await getAdminUsers({ q: "page", page: "2" });
    assert.equal(page1.rows.length, 25);
    assert.equal(page2.rows.length, 1);
    assert.equal((await getAdminUsers({ q: "page", page: "999" })).page, 2);
    assert.equal(
      await sendMail({
        to: customer.email,
        subject: "Queued",
        text: "sensitive",
        idempotencyKey: "test:send",
      }),
      false,
    );
    process.env.RESEND_API_KEY = "local-test-key";
    process.env.EMAIL_FROM = "test@example.invalid";
    let requests = 0;
    globalThis.fetch = async () => {
      requests++;
      return Response.json({ id: "provider-fixture-id" });
    };
    await sendMail({
      to: customer.email,
      subject: "Queued",
      text: "sensitive",
      idempotencyKey: "test:send",
    });
    await sendMail({
      to: customer.email,
      subject: "Queued",
      text: "sensitive",
      idempotencyKey: "test:send",
    });
    assert.equal(requests, 1);
    const sent = await EmailOutbox.findOne({ key: "test:send" });
    assert.equal(sent.attempts, 1);
    assert.equal(sent.providerMessageId, "provider-fixture-id");
    assert.ok(sent.sentAt);
    globalThis.fetch = async () =>
      new Response("private upstream error", { status: 500 });
    await assert.rejects(
      sendMail({
        to: customer.email,
        subject: "Failure",
        text: "test",
        idempotencyKey: "test:failure",
      }),
    );
    const failed = await EmailOutbox.findOne({ key: "test:failure" });
    assert.equal(failed.status, "pending");
    assert.equal(failed.attempts, 1);
    assert.equal(failed.lastError.includes("private upstream"), false);
    console.log(
      "PASS: confirmed-only net sales, refunds, UTC totals, processing queues, guest emails, account search/spending, safe DTOs, pagination, wallet ledger, email metadata, idempotent sends and failure tracking.",
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
