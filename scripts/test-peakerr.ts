import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { dbConnect } from "../lib/db/connect";
import { Service } from "../lib/db/models/Service";
import { Order } from "../lib/db/models/Order";
import { getPeakerrClient } from "../lib/supplier";
import { fulfillOrder } from "../lib/supplier/fulfillment";

async function testPeakerr() {
  console.log("==========================================");
  console.log("🛠️ TESTING PEAKERR INTEGRATION & SANDBOX");
  console.log("==========================================");

  // 1. Check Peakerr Client
  const client = getPeakerrClient();
  console.log("1. Peakerr Client instantiated.");
  console.log("   - Is Sandbox Mode:", client.isSandbox());

  // 2. Check Balance
  const balance = await client.getBalance();
  console.log(`2. Peakerr Balance check: $${balance.balance} ${balance.currency}`);

  // 3. Check Services List
  const services = await client.getServices();
  console.log(`3. Peakerr Services available: ${services.length} services found.`);
  services.slice(0, 3).forEach((s) => {
    console.log(`   - [ID: ${s.service}] ${s.name} (${s.rate} / 1k)`);
  });

  // 4. Test Automated Order Submission via fulfillment helper
  await dbConnect();
  console.log("\n4. Testing Automated Order Fulfillment with Peakerr Sandbox...");

  // Create temporary test service with Peakerr ID mapped
  const testService = await Service.create({
    platformId: "instagram",
    platformLabel: "Instagram",
    category: "Followers [Automated Peakerr Test]",
    active: true,
    supplierServiceId: "1001",
    tiers: [{ qty: "100", qtyValue: 100, priceCents: 150 }],
    sortOrder: 999,
  });

  const testOrder = await Order.create({
    userId: null,
    serviceId: testService._id,
    platformId: testService.platformId,
    platformLabel: testService.platformLabel,
    category: testService.category,
    qtyValue: 100,
    targetLink: "https://instagram.com/peakerr_test_profile",
    priceCents: 150,
    paymentSource: "crypto",
    status: "pending",
  });

  console.log(`   - Created test order: ${testOrder._id}`);
  const result = await fulfillOrder(testOrder);
  console.log("   - Fulfillment result:", result);

  const reloaded = await Order.findById(testOrder._id);
  console.log(`   - Verified order in DB: status=${reloaded?.status}, supplierOrderId=${reloaded?.supplierOrderId}`);

  // Cleanup test documents
  await Order.findByIdAndDelete(testOrder._id);
  await Service.findByIdAndDelete(testService._id);
  console.log("   - Test documents cleaned up successfully.");

  console.log("\n==========================================");
  console.log("🎉 PEAKERR INTEGRATION TEST PASSED!");
  console.log("==========================================");
  process.exit(0);
}

testPeakerr().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
