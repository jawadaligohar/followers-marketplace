import dotenv from "dotenv";
import { assertIsolatedTestServer } from "../lib/testing";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { dbConnect } from "../lib/db/connect";
import { Service } from "../lib/db/models/Service";
import { Order } from "../lib/db/models/Order";
import { User } from "../lib/db/models/User";
import { getNowpaymentsIpnSecret } from "../lib/nowpayments";
import { getPeakerrClient } from "../lib/supplier";
import { fulfillOrder } from "../lib/supplier/fulfillment";
import crypto from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function generateIpnSignature(payload: Record<string, unknown>, secret: string): string {
  const sorted = Object.keys(payload)
    .sort()
    .reduce((acc, key) => {
      acc[key] = payload[key];
      return acc;
    }, {} as Record<string, unknown>);
  return crypto.createHmac("sha512", secret).update(JSON.stringify(sorted)).digest("hex");
}

async function runMasterE2ETest() {
  await assertIsolatedTestServer(BASE_URL);
  console.log("======================================================================");
  console.log("🌟 MASTER END-TO-END SYSTEM TEST: CRYPTO CHECKOUT + PEAKERR FULFILLMENT");
  console.log("======================================================================");

  // -------------------------------------------------------------------------
  // STEP 1: Connect to Database & Verify Server Availability
  // -------------------------------------------------------------------------
  console.log("\n📡 STEP 1: Checking Server & Database Health...");
  await dbConnect();
  console.log("   ✅ MongoDB Atlas: Connected successfully.");

  const healthRes = await fetch(`${BASE_URL}`).catch(() => null);
  if (!healthRes || !healthRes.ok) {
    throw new Error(`Server at ${BASE_URL} is not responding (Status: ${healthRes?.status}). Please ensure next dev is running.`);
  }
  console.log(`   ✅ Next.js Web Server: Online at ${BASE_URL} (HTTP ${healthRes.status}).`);

  // -------------------------------------------------------------------------
  // STEP 2: Peakerr Wholesale Supplier & Sandbox Verification
  // -------------------------------------------------------------------------
  console.log("\n⚡ STEP 2: Verifying Peakerr Supplier Integration & Sandbox Simulator...");
  const peakerr = getPeakerrClient();
  const isSandbox = peakerr.isSandbox();
  console.log(`   - Supplier Client Mode: ${isSandbox ? "SANDBOX SIMULATOR" : "LIVE"}`);
  
  const balance = await peakerr.getBalance();
  console.log(`   - Wholesale Account Balance: $${balance.balance.toFixed(2)} ${balance.currency}`);
  if (balance.balance < 1) {
    throw new Error("Peakerr balance check failed.");
  }
  console.log("   ✅ Step 2 PASSED: Peakerr supplier is fully operational.");

  // -------------------------------------------------------------------------
  // STEP 3: Setup Test Services (One Automated, One Manual)
  // -------------------------------------------------------------------------
  console.log("\n📦 STEP 3: Creating Test Services in Database...");
  const autoService = await Service.create({
    slug: `e2e-auto-${Date.now()}`,
    platformId: "instagram",
    platformLabel: "Instagram",
    category: "Followers [E2E Auto]",
    active: true,
    supplierServiceId: "1001", // Mapped to Peakerr
    tiers: [{ qty: "100", qtyValue: 100, priceCents: 299 }],
    sortOrder: 990,
  });

  const manualService = await Service.create({
    slug: `e2e-manual-${Date.now()}`,
    platformId: "tiktok",
    platformLabel: "TikTok",
    category: "Followers [E2E Manual]",
    active: true,
    supplierServiceId: null, // No Peakerr mapping -> manual fallback
    tiers: [{ qty: "50", qtyValue: 50, priceCents: 199 }],
    sortOrder: 991,
  });

  console.log(`   - Service A (Automated): ID=${autoService._id}, PeakerrID=${autoService.supplierServiceId}, Price=$2.99`);
  console.log(`   - Service B (Manual):    ID=${manualService._id}, PeakerrID=NONE, Price=$1.99`);
  console.log("   ✅ Step 3 PASSED: Test services created.");

  // -------------------------------------------------------------------------
  // STEP 4: Real HTTP Multi-Item Cart Checkout with Crypto (POST /api/checkout)
  // -------------------------------------------------------------------------
  console.log("\n🛒 STEP 4: Executing Real HTTP Multi-Item Cart Checkout with Crypto...");
  const checkoutPayload = {
    items: [
      { serviceId: autoService._id.toString(), qtyValue: 100, targetLink: "https://instagram.com/e2e_auto_client" },
      { serviceId: manualService._id.toString(), qtyValue: 50, targetLink: "https://tiktok.com/@e2e_manual_client" },
    ],
    paymentSource: "crypto",
    guestEmail: "e2e-crypto-shopper@example.com",
  };

  const checkoutRes = await fetch(`${BASE_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkoutPayload),
  });

  const checkoutData = await checkoutRes.json();
  if (!checkoutRes.ok || !checkoutData.checkoutUrl) {
    throw new Error(`Checkout failed (${checkoutRes.status}): ${JSON.stringify(checkoutData)}`);
  }

  console.log(`   ✅ HTTP 200 OK from /api/checkout!`);
  console.log(`   - Live NOWPayments Invoice URL: ${checkoutData.checkoutUrl}`);

  // Extract Invoice ID from URL
  const invoiceIdMatch = checkoutData.checkoutUrl.match(/iid=(\d+)/);
  const invoiceId = invoiceIdMatch ? Number(invoiceIdMatch[1]) : 123456789;

  // Verify pending orders were created in MongoDB
  const createdOrders = await Order.find({
    serviceId: { $in: [autoService._id, manualService._id] },
    status: "pending",
  });

  if (createdOrders.length !== 2) {
    throw new Error(`Expected 2 pending orders in DB, found ${createdOrders.length}`);
  }

  const cryptoCheckoutId = createdOrders[0].cryptoCheckoutId;
  console.log(`   - Found ${createdOrders.length} pending orders with Crypto ID: ${cryptoCheckoutId}`);
  console.log("   ✅ Step 4 PASSED: Multi-item crypto orders successfully registered.");

  // -------------------------------------------------------------------------
  // STEP 5: Security Test - Webhook Signature Verification
  // -------------------------------------------------------------------------
  console.log("\n🛡️ STEP 5: Verifying Security - Rejecting Spoofed / Tampered Webhook...");
  const spoofedRes = await fetch(`${BASE_URL}/api/webhooks/nowpayments-cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nowpayments-sig": "invalid_fake_hmac_signature_00000000000000000000000000000",
    },
    body: JSON.stringify({ order_id: cryptoCheckoutId, payment_status: "finished" }),
  });

  if (spoofedRes.status === 401) {
    console.log(`   ✅ Security check PASSED: Spoofed signature rejected with HTTP 401 Unauthorized.`);
  } else {
    throw new Error(`Security vulnerability: expected 401, got ${spoofedRes.status}`);
  }

  // -------------------------------------------------------------------------
  // STEP 6: Real HTTP Webhook IPN Callback (POST /api/webhooks/nowpayments-cart)
  // -------------------------------------------------------------------------
  console.log("\n🔔 STEP 6: Simulating Confirmed NOWPayments IPN Webhook Delivery...");
  const ipnSecret = getNowpaymentsIpnSecret();
  if (!ipnSecret) {
    throw new Error("NOWPAYMENTS_IPN_SECRET is missing in environment.");
  }

  const webhookBody = {
    payment_id: Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 900) + 100,
    invoice_id: invoiceId,
    payment_status: "finished",
    order_id: cryptoCheckoutId,
    price_amount: 4.98,
    price_currency: "usd",
    pay_currency: "usdttrc20",
  };

  const validSig = generateIpnSignature(webhookBody, ipnSecret);

  const webhookRes = await fetch(`${BASE_URL}/api/webhooks/nowpayments-cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nowpayments-sig": validSig,
    },
    body: JSON.stringify(webhookBody),
  });

  const webhookResult = await webhookRes.json();
  if (!webhookRes.ok || !webhookResult.received) {
    throw new Error(`Webhook handler failed (${webhookRes.status}): ${JSON.stringify(webhookResult)}`);
  }
  console.log(`   ✅ HTTP 200 OK from /api/webhooks/nowpayments-cart! (Payload accepted & processed)`);

  // -------------------------------------------------------------------------
  // STEP 7: Verify Database State & Hybrid Peakerr Fulfillment
  // -------------------------------------------------------------------------
  console.log("\n🔍 STEP 7: Verifying Database Mutations & Hybrid Supplier Routing...");
  const orderA = await Order.findOne({ serviceId: autoService._id });
  const orderB = await Order.findOne({ serviceId: manualService._id });

  if (!orderA || !orderB) {
    throw new Error("Could not reload test orders from database.");
  }

  console.log(`   - Order A (Mapped to Peakerr #1001):`);
  console.log(`     • Status:         ${orderA.status} (Expected: processing)`);
  console.log(`     • Supplier Order: ${orderA.supplierOrderId} (Expected: sim-pk-...)`);
  console.log(`     • Target Link:    ${orderA.targetLink}`);

  if (orderA.status !== "processing" || !orderA.supplierOrderId?.startsWith("sim-pk-")) {
    throw new Error(`Automated Peakerr dispatch failed for Order A! Status: ${orderA.status}, SupplierOrderId: ${orderA.supplierOrderId}`);
  }
  console.log(`     ✅ Order A: AUTOMATICALLY FULFILLED via Peakerr Sandbox.`);

  console.log(`   - Order B (Unmapped / Manual Service):`);
  console.log(`     • Status:         ${orderB.status} (Expected: processing)`);
  console.log(`     • Supplier Status:${orderB.supplierStatus} (Expected: manual_fulfillment_required)`);
  console.log(`     • Supplier Order: ${orderB.supplierOrderId} (Expected: null)`);

  if (orderB.status !== "processing" || orderB.supplierStatus !== "manual_fulfillment_required") {
    throw new Error(`Manual fallback failed for Order B! Status: ${orderB.status}, SupplierStatus: ${orderB.supplierStatus}`);
  }
  console.log(`     ✅ Order B: SAFELY QUEUED for manual fulfillment (zero errors, not failed).`);
  console.log("   ✅ Step 7 PASSED: Hybrid automated & manual routing verified in MongoDB.");

  // -------------------------------------------------------------------------
  // STEP 8: Test Admin One-Click Peakerr Dispatch
  // -------------------------------------------------------------------------
  console.log("\n🚀 STEP 8: Testing Admin One-Click Peakerr Dispatch on Manual Order B...");
  const adminDispatchResult = await fulfillOrder(orderB, { manualSupplierServiceId: "1002" });
  console.log(`   - Dispatch Result:`, adminDispatchResult);

  const orderBReloaded = await Order.findById(orderB._id);
  console.log(`   - Order B After Admin Dispatch:`);
  console.log(`     • Status:         ${orderBReloaded?.status}`);
  console.log(`     • Supplier Order: ${orderBReloaded?.supplierOrderId}`);

  if (!orderBReloaded?.supplierOrderId?.startsWith("sim-pk-")) {
    throw new Error("Admin manual dispatch failed to assign Peakerr supplier order ID.");
  }
  console.log("   ✅ Step 8 PASSED: Admin one-click dispatch successfully submitted order to Peakerr.");

  // -------------------------------------------------------------------------
  // STEP 9: Test Wallet Top-Up via Crypto IPN
  // -------------------------------------------------------------------------
  console.log("\n💰 STEP 9: Testing Crypto Wallet Top-Up IPN...");
  const testUser = await User.findOne();
  if (testUser) {
    const initialBalance = testUser.walletBalanceCents;
    const topupCents = 1500; // $15.00
    const topupOrderId = `topup_${testUser._id.toString()}_${Date.now()}`;

    const topupBody = {
      payment_id: Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 900) + 200,
      invoice_id: 99887711,
      payment_status: "finished",
      order_id: topupOrderId,
      price_amount: 15.0,
      price_currency: "usd",
      pay_currency: "usdttrc20",
    };

    const topupSig = generateIpnSignature(topupBody, ipnSecret);

    const topupRes = await fetch(`${BASE_URL}/api/webhooks/nowpayments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nowpayments-sig": topupSig,
      },
      body: JSON.stringify(topupBody),
    });

    const topupJson = await topupRes.json();
    if (!topupRes.ok || !topupJson.received) {
      throw new Error(`Wallet topup webhook failed: ${JSON.stringify(topupJson)}`);
    }

    const updatedUser = await User.findById(testUser._id);
    const balanceDiff = (updatedUser?.walletBalanceCents ?? 0) - initialBalance;
    console.log(`   - Initial User Balance: $${(initialBalance / 100).toFixed(2)}`);
    console.log(`   - New User Balance:     $${((updatedUser?.walletBalanceCents ?? 0) / 100).toFixed(2)} (+ $${(balanceDiff / 100).toFixed(2)})`);

    if (balanceDiff !== topupCents) {
      throw new Error(`Wallet top-up discrepancy: expected +${topupCents} cents, got +${balanceDiff}`);
    }
    console.log("   ✅ Step 9 PASSED: Crypto wallet top-up instantly credited user balance.");
  }

  // -------------------------------------------------------------------------
  // STEP 10: Cleanup Test Data
  // -------------------------------------------------------------------------
  console.log("\n🧹 STEP 10: Cleaning Up Test Artifacts...");
  await Order.deleteMany({ _id: { $in: [orderA._id, orderB._id] } });
  await Service.deleteMany({ _id: { $in: [autoService._id, manualService._id] } });
  console.log("   ✅ Test orders and test services cleaned up cleanly.");

  console.log("\n======================================================================");
  console.log("🎉 ALL 10 END-TO-END SYSTEM TESTS PASSED WITH 100% SUCCESS!");
  console.log("======================================================================");
  process.exit(0);
}

runMasterE2ETest().catch((err) => {
  console.error("\n❌ MASTER E2E TEST FAILED:", err);
  process.exit(1);
});

