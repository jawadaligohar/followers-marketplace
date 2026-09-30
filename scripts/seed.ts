import "dotenv/config";
import bcrypt from "bcryptjs";
import { dbConnect } from "../lib/db/connect";
import { Service } from "../lib/db/models/Service";
import { User } from "../lib/db/models/User";
import { PLATFORM_PRICING } from "../lib/pricing";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
};

async function seed() {
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
