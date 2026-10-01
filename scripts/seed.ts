import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import bcrypt from "bcryptjs";


const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
};

async function seed() {
  const { dbConnect } = await import("../lib/db/connect");
  const { Service } = await import("../lib/db/models/Service");
  const { User } = await import("../lib/db/models/User");
  const { PLATFORM_PRICING } = await import("../lib/pricing");

  await dbConnect();

  for (const [platformId, tiers] of Object.entries(PLATFORM_PRICING)) {
    await Service.findOneAndUpdate(
      { platformId },
      {
        platformId,
        platformLabel: PLATFORM_LABELS[platformId] ?? platformId,
        category: "Followers",
        active: true,
        supplierServiceId: null,
        sortOrder: Object.keys(PLATFORM_PRICING).indexOf(platformId),
        tiers: tiers.map((t) => ({
          qty: t.qty,
          qtyValue: t.qtyValue,
          priceCents: Math.round(t.price * 100),
          highlight: t.highlight ?? false,
        })),
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded service: ${platformId}`);
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.findOneAndUpdate(
      { email: adminEmail.toLowerCase() },
      {
        $setOnInsert: {
          name: "Admin",
          email: adminEmail.toLowerCase(),
          provider: "credentials",
        },
        $set: {
          passwordHash,
          role: "admin",
        },
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded admin user: ${adminEmail}`);
  } else {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set -- skipping admin user seed");
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
