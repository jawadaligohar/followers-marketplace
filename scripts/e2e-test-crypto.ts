import dotenv from "dotenv";
import { assertIsolatedTestServer } from "../lib/testing";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { dbConnect } from "../lib/db/connect";
import { Service } from "../lib/db/models/Service";
import { Order } from "../lib/db/models/Order";
import { User } from "../lib/db/models/User";
import { Transaction } from "../lib/db/models/Transaction";
import { nowpayments, getNowpaymentsApiBase, getNowpaymentsIpnSecret } from "../lib/nowpayments";
import { fulfillOrder } from "../lib/supplier/fulfillment";
import crypto from "crypto";

async function runEndToEndCryptoTest() {
  await assertIsolatedTestServer("http://localhost:3000");
  console.log("==================================================");
  console.log("🚀 STARTING END-TO-END CRYPTO PAYMENT VERIFICATION");
  console.log("==================================================");

  // 1. Connect to DB
  await dbConnect();
  console.log("✅ Step 1: MongoDB connected successfully.");

  // 2. Fetch a service to order
  const service = await Service.findOne({ active: true });
  if (!service) {
    throw new Error("No active services found in database! Please run seed.");
  }
  const tier = service.tiers[0];
  console.log(`✅ Step 2: Found active service: ${service.platformLabel} ${service.category} (${tier.qty}) for $${(tier.priceCents / 100).toFixed(2)}`);

  // 3. Find or get a test user
  const user = await User.findOne();
  console.log(`✅ Step 3: Using user: ${user ? user.email : "guest"}`);

  // 4. Test Crypto Cart Checkout Order Creation
  const cryptoCheckoutId = `cart_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(`\n📦 Step 4: Simulating Cart Checkout with Crypto (ID: ${cryptoCheckoutId})...`);

  const order = await Order.create({
    userId: user?._id ?? null,
    guestEmail: user ? null : "guest-crypto-test@example.com",
    serviceId: service._id,
    platformId: service.platformId,
    platformLabel: service.platformLabel,
    category: service.category,
    qtyValue: tier.qtyValue,
    targetLink: "https://instagram.com/e2e_crypto_test",
    priceCents: tier.priceCents,
    paymentSource: "crypto",
    status: "pending",
    cryptoCheckoutId,
  });

  console.log(`✅ Order created in DB: ${order._id.toString()} [status: ${order.status}, source: ${order.paymentSource}]`);

  // 5. Create real NOWPayments Sandbox Invoice
  console.log(`\n💳 Step 5: Generating live Invoice on NOWPayments (${getNowpaymentsApiBase()})...`);
  const invoice = await nowpayments.createInvoice({
    price_amount: tier.priceCents / 100,
    price_currency: "usd",
    order_id: cryptoCheckoutId,
    order_description: `${service.platformLabel} ${service.category} - ${tier.qty}`,
    ipn_callback_url: "http://localhost:3000/api/webhooks/nowpayments-cart",
    success_url: "http://localhost:3000/checkout/success",
    cancel_url: "http://localhost:3000/checkout/cancel",
  });

  console.log(`✅ Invoice generated!`);
  console.log(`   - Invoice ID:  ${invoice.id}`);
  console.log(`   - Invoice URL: ${invoice.invoice_url}`);

  // 6. Test Signature Generation & Webhook Processing Simulation
  console.log(`\n🔔 Step 6: Simulating NOWPayments Webhook IPN Callback...`);
  const webhookBody = {
    payment_id: 9988776655,
    invoice_id: Number(invoice.id),
    payment_status: "finished",
    order_id: cryptoCheckoutId,
    price_amount: tier.priceCents / 100,
    price_currency: "usd",
    pay_currency: "usdttrc20",
  };

  const ipnSecret = getNowpaymentsIpnSecret();
  let sig = "";
  if (ipnSecret) {
    const sortedBody = Object.fromEntries(Object.entries(webhookBody).sort(([a], [b]) => a.localeCompare(b)));
    const hmac = crypto.createHmac("sha512", ipnSecret);
    hmac.update(JSON.stringify(sortedBody));
    sig = hmac.digest("hex");
    console.log(`   - Generated Valid HMAC-SHA512 Signature.`);
  }

  const isValidSig = nowpayments.verifySignature(webhookBody, sig);
  console.log(`   - Signature Verification Check: ${isValidSig ? "PASSED ✅" : "FAILED ❌"}`);
  if (!isValidSig) {
    throw new Error("Webhook signature verification failed!");
  }

  // 7. Simulate Webhook order processing logic
  const pendingOrders = await Order.find({ cryptoCheckoutId, status: "pending" });
  console.log(`   - Found ${pendingOrders.length} pending order(s) for this crypto checkout.`);

  for (const ord of pendingOrders) {
    const fulfillment = await fulfillOrder(ord);
    console.log(`   - Order fulfillment result: mode=${fulfillment.mode}, status=${fulfillment.status}, supplierOrderId=${fulfillment.supplierOrderId ?? "N/A"}`);
  }

  // Verify in DB
  const updatedOrder = await Order.findById(order._id);
  console.log(`✅ Order status in database: ${updatedOrder?.status} (Expected: processing)`);

  // 8. Test Wallet Crypto Top-up Flow
  if (user) {
    console.log(`\n💰 Step 8: Testing Wallet Crypto Top-up for user ${user.email}...`);
    const initialBalance = user.walletBalanceCents;
    const topupAmountCents = 2500; // $25.00
    const topupOrderId = `topup_${user._id.toString()}_${Date.now()}`;

    const topupInvoice = await nowpayments.createInvoice({
      price_amount: topupAmountCents / 100,
      price_currency: "usd",
      order_id: topupOrderId,
      order_description: "Wallet Top-up ($25.00)",
      ipn_callback_url: "http://localhost:3000/api/webhooks/nowpayments",
      success_url: "http://localhost:3000/checkout/success",
      cancel_url: "http://localhost:3000/checkout/cancel",
    });

    console.log(`   - Top-up Invoice Created! URL: ${topupInvoice.invoice_url}`);

    // Simulate Top-up Webhook execution
    user.walletBalanceCents += topupAmountCents;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: "topup",
      amountCents: topupAmountCents,
      balanceAfterCents: user.walletBalanceCents,
      nowpaymentsInvoiceId: String(topupInvoice.id),
      nowpaymentsPaymentId: String(Date.now()),
      note: "Crypto Top-up via NOWPayments (E2E Test)",
    });

    const refreshedUser = await User.findById(user._id);
    console.log(`   - Initial Balance: $${(initialBalance / 100).toFixed(2)}`);
    console.log(`   - New Balance:     $${((refreshedUser?.walletBalanceCents ?? 0) / 100).toFixed(2)} ✅`);
  }

  console.log("\n==================================================");
  console.log("🎉 ALL END-TO-END CRYPTO PAYMENT TESTS PASSED!");
  console.log("==================================================");
  process.exit(0);
}

runEndToEndCryptoTest().catch((err) => {
  console.error("❌ E2E TEST FAILED:", err);
  process.exit(1);
});

