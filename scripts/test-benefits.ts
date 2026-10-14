import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import mongoose from "mongoose";
import { dbConnect } from "../lib/db/connect";
import { User } from "../lib/db/models/User";
import { Order } from "../lib/db/models/Order";
import { Service } from "../lib/db/models/Service";
import { Transaction } from "../lib/db/models/Transaction";
import {
  BonusClaim,
  EmailOutbox,
  LuckyDraw,
  RewardRedemption,
  BankTransfer,
} from "../lib/db/models/Benefits";
import {
  claimBonus,
  markOrdersPaid,
  rewardSummary,
  redeemRewards,
  monthlyDrawPool,
  runMonthlyDraw,
} from "../lib/benefits";
import {
  drawEntries,
  DRAW_ENTRY_CENTS,
  loyaltyCreditCents,
} from "../lib/benefitMath";
import { orderAccessToken, verifyOrderAccessToken } from "../lib/orderAccess";
import { resolveLine } from "../lib/orderLine";
import { createBankTransfer, confirmBankTransfer } from "../lib/bankTransfer";
import { applyWalletTransaction } from "../lib/wallet";
import { fulfillOrder } from "../lib/supplier/fulfillment";
import { createWalletOrders, fulfillWalletOrders } from "../lib/walletCheckout";
import { PeakerrSupplierClient } from "../lib/supplier/peakerrSupplierClient";
import { recordExternalRefund } from "../lib/refunds";

async function main() {
  if (
    !/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/followers_benefits_test(?:\?|$)/.test(
      process.env.MONGODB_URI || "",
    )
  )
    throw new Error(
      "Use a local replica-set database named followers_benefits_test; remote databases are refused",
    );
  process.env.AUTH_SECRET = "isolated-benefits-test-secret";
  process.env.RESEND_API_KEY = "";
  process.env.EMAIL_FROM = "";
  process.env.BANK_TRANSFER_INSTRUCTIONS = "Test bank — local fixture only";
  process.env.PEAKERR_SANDBOX = "true";
  await dbConnect();
  await mongoose.connection.dropDatabase();
  try {
    execFileSync(
      process.execPath,
      ["--import", "tsx", "scripts/seed.ts", "--services-only"],
      {
        env: { ...process.env, SEED_ADMIN_EMAIL: "", SEED_ADMIN_PASSWORD: "" },
        stdio: "pipe",
      },
    );
    await Promise.all(
      [
        BonusClaim,
        EmailOutbox,
        LuckyDraw,
        RewardRedemption,
        BankTransfer,
        User,
        Transaction,
      ].map((model) => model.createIndexes()),
    );
    const alice = await User.create({
      name: "Local test",
      email: "alice@example.invalid",
      walletBalanceCents: 100000,
    });
    const service = await Service.findOne({ slug: "instagram-likes" });
    async function order(
      priceCents: number,
      group: string,
      paymentSource = "card",
    ) {
      return Order.create({
        userId: alice._id,
        customerEmail: alice.email,
        serviceId: service._id,
        platformId: "instagram",
        platformLabel: "Instagram",
        category: "Likes",
        qtyValue: 100,
        targetLink: "https://instagram.com/p/test",
        priceCents,
        checkoutGroupId: group,
        paymentSource,
      });
    }
    const first = await order(10000, "checkout_test");
    const second = await order(20000, "checkout_test");
    await assert.rejects(
      claimBonus("checkout_test", "https://instagram.com/p/bonus"),
      /confirmed/,
    );
    await markOrdersPaid([String(first._id), String(second._id)]);
    await markOrdersPaid([String(first._id), String(second._id)]);
    assert.equal(await EmailOutbox.countDocuments(), 1);
    const token = orderAccessToken("checkout_test");
    assert.equal(verifyOrderAccessToken(token), "checkout_test");
    assert.equal(verifyOrderAccessToken(token + "x"), null);
    const claims = await Promise.allSettled([
      claimBonus("checkout_test", "https://instagram.com/p/bonus"),
      claimBonus("checkout_test", "https://instagram.com/p/bonus"),
    ]);
    assert.equal(claims.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(await BonusClaim.countDocuments(), 1);
    const bonus = await Order.findOne({ paymentSource: "bonus" });
    assert.equal(bonus.qtyValue, 50);
    assert.equal(bonus.priceCents, 0);
    const summary = await rewardSummary(String(alice._id));
    assert.equal(summary.availableCents, 300);
    const redemptions = await Promise.allSettled([
      redeemRewards(String(alice._id)),
      redeemRewards(String(alice._id)),
    ]);
    assert.equal(redemptions.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal((await User.findById(alice._id)).walletBalanceCents, 100300);
    await applyWalletTransaction({
      userId: alice._id,
      type: "refund",
      amountCents: 10000,
      relatedOrderId: first._id,
    });
    assert.equal((await rewardSummary(String(alice._id))).availableCents, 0);
    await assert.rejects(
      applyWalletTransaction({
        userId: alice._id,
        type: "refund",
        amountCents: 10000,
        relatedOrderId: first._id,
      }),
      /remaining/,
    );
    await applyWalletTransaction({
      userId: alice._id,
      type: "topup",
      amountCents: 20000,
    });
    const walletOrder = await order(10000, "checkout_wallet_test", "wallet");
    await markOrdersPaid([String(walletOrder._id)]);
    const currentMonth = new Date().toISOString().slice(0, 7);
    let pool = await monthlyDrawPool(currentMonth);
    assert.equal(pool[0].qualifyingCents, 40000);
    await applyWalletTransaction({
      userId: alice._id,
      type: "refund",
      amountCents: 10000,
      relatedOrderId: walletOrder._id,
    });
    pool = await monthlyDrawPool(currentMonth);
    assert.equal(pool[0].qualifyingCents, 30000);
    assert.equal(pool[0].entries, drawEntries(30000));
    assert.equal(DRAW_ENTRY_CENTS, 13247);
    assert.equal(loyaltyCreditCents(999), 9);
    const line = await resolveLine(
      {
        serviceId: String(service._id),
        qtyValue: 100,
        targetLink: "https://instagram.com/p/bank",
      },
      "bank",
    );
    const transfer = await createBankTransfer({
      email: alice.email,
      userId: String(alice._id),
      lines: [line],
    });
    const bankOrder = await Order.findOne({
      checkoutGroupId: transfer.reference,
    });
    assert.equal(bankOrder.paymentConfirmedAt, null);
    assert.equal((await fulfillOrder(bankOrder)).success, false);
    await confirmBankTransfer(transfer.reference);
    await confirmBankTransfer(transfer.reference);
    assert.ok((await Order.findById(bankOrder._id)).paymentConfirmedAt);
    const topup = await createBankTransfer({
      email: alice.email,
      userId: String(alice._id),
      topupCents: 5000,
    });
    const beforeTopup = (await User.findById(alice._id)).walletBalanceCents;
    await Promise.all([
      confirmBankTransfer(topup.reference),
      confirmBankTransfer(topup.reference),
    ]);
    assert.equal(
      (await User.findById(alice._id)).walletBalanceCents,
      beforeTopup + 5000,
    );
    const previousDate = new Date();
    previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
    previousDate.setUTCDate(10);
    const previousMonth = previousDate.toISOString().slice(0, 7);
    const past = await order(20000, "checkout_past");
    await Order.updateOne(
      { _id: past._id },
      { paymentConfirmedAt: previousDate },
    );
    const draw = await runMonthlyDraw(previousMonth, 5000);
    assert.equal(String(draw.winnerUserId), String(alice._id));
    await assert.rejects(runMonthlyDraw(previousMonth, 5000));
    await assert.rejects(runMonthlyDraw(currentMonth, 5000), /completed month/);
    const earned = await rewardSummary(String(alice._id));
    assert.equal(earned.prizes[0].amountCents, 5000);
    await redeemRewards(String(alice._id));
    assert.equal((await rewardSummary(String(alice._id))).prizes.length, 0);
    const closedBefore = (await monthlyDrawPool(previousMonth)).find(
      (row) => row.userId === String(alice._id),
    )!.entries;
    await recordExternalRefund(
      [String(past._id)],
      20000,
      "fixture:past-refund",
    );
    assert.equal(
      (await monthlyDrawPool(previousMonth)).find(
        (row) => row.userId === String(alice._id),
      )!.entries,
      closedBefore,
    );
    await recordExternalRefund(
      [String(bankOrder._id)],
      100,
      "fixture:bank-refund",
    );
    await recordExternalRefund(
      [String(bankOrder._id)],
      100,
      "fixture:bank-refund",
    );
    assert.equal((await Order.findById(bankOrder._id)).refundedCents, 100);
    await recordExternalRefund(
      [String(bankOrder._id)],
      bankOrder.priceCents,
      "fixture:bank-refund",
    );
    assert.equal(
      (await Order.findById(bankOrder._id)).refundedCents,
      bankOrder.priceCents,
    );
    await assert.rejects(
      claimBonus(transfer.reference, "https://instagram.com/p/test"),
      /confirmed/,
    );
    const cardOnly = await User.create({
      name: "Concurrent wallet test",
      email: "wallet@example.invalid",
      walletBalanceCents: 0,
    });
    const walletLine = await resolveLine(
      {
        serviceId: String(service._id),
        qtyValue: 100,
        targetLink: "https://instagram.com/p/wallet",
      },
      "wallet",
    );
    await User.updateOne(
      { _id: cardOnly._id },
      { walletBalanceCents: walletLine.chargeCents },
    );
    const walletAttempts = await Promise.allSettled([
      createWalletOrders(
        [walletLine],
        String(cardOnly._id),
        cardOnly.email,
        "checkout_concurrent_wallet_1",
      ),
      createWalletOrders(
        [walletLine],
        String(cardOnly._id),
        cardOnly.email,
        "checkout_concurrent_wallet_2",
      ),
    ]);
    const successfulWallet = walletAttempts.find(
      (result) => result.status === "fulfilled",
    );
    assert.ok(successfulWallet?.status === "fulfilled");
    assert.equal(
      walletAttempts.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(await Order.countDocuments({ userId: cardOnly._id }), 1);
    assert.equal((await User.findById(cardOnly._id)).walletBalanceCents, 0);
    await fulfillWalletOrders(successfulWallet.value);
    assert.ok(
      (await Order.findById(successfulWallet.value[0]._id)).paymentConfirmedAt,
    );
    const guestDate = new Date(previousDate);
    guestDate.setUTCMonth(guestDate.getUTCMonth() - 1);
    await LuckyDraw.create({
      month: guestDate.toISOString().slice(0, 7),
      winnerEmail: alice.email,
      totalEntries: 1,
      prizeCents: 1000,
    });
    assert.equal((await rewardSummary(String(alice._id))).prizes.length, 0);
    await User.updateOne({ _id: alice._id }, { emailVerified: new Date() });
    assert.equal(
      (await rewardSummary(String(alice._id))).prizes[0].amountCents,
      1000,
    );
    const originalFetch = globalThis.fetch;
    process.env.PEAKERR_SANDBOX = "false";
    try {
      globalThis.fetch = async (_url, init) => {
        const body = new URLSearchParams(String(init?.body));
        assert.equal(body.get("posts"), "90");
        assert.equal(body.get("min"), "1000");
        const expiry = new Date();
        expiry.setUTCDate(expiry.getUTCDate() + 30);
        assert.equal(
          body.get("expiry"),
          `${expiry.getUTCDate()}/${expiry.getUTCMonth() + 1}/${expiry.getUTCFullYear()}`,
        );
        return new Response(JSON.stringify({ order: 123 }));
      };
      await new PeakerrSupplierClient("local-fixture-key").submitOrder({
        supplierServiceId: "9001",
        link: "https://instagram.com/example",
        quantity: 1000,
        subscription: { username: "example", posts: 90 },
      });
    } finally {
      globalThis.fetch = originalFetch;
      process.env.PEAKERR_SANDBOX = "true";
    }
    console.log(
      "PASS: payment-only bonuses, duplicate claims, token tampering, concurrent loyalty redemption, refund adjustments, draw entry accounting, fixed prize redemption, bank order confirmation, and duplicate bank credits.",
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
