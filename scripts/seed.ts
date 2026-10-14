import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import bcrypt from "bcryptjs";


async function seed() {
  const { dbConnect } = await import("../lib/db/connect");
  const { Service } = await import("../lib/db/models/Service");
  const { User } = await import("../lib/db/models/User");
  const { CATALOG, PLATFORMS } = await import("../lib/catalog");
  const { catalogTiers } = await import("../lib/serviceDocs");

  await dbConnect();

  // Services created before slugs existed were one "Followers" service per platform.
  // Give them their catalog slug so existing orders keep pointing at the same documents.
  const legacy = await Service.collection.find({ slug: { $exists: false } }).toArray();
  for (const doc of legacy) {
    let slug = `${doc.platformId}-${String(doc.category)}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (await Service.collection.findOne({ slug })) slug = `${slug}-${doc._id}`;
    await Service.collection.updateOne({ _id: doc._id }, { $set: { slug } });
    console.log(`Assigned slug to legacy service: ${slug}`);
  }
  await Service.createIndexes();

  // These exact records were left active by the earlier checkout test run.
  // Hide them without deleting records referenced by existing test orders.
  const hiddenTests = await Service.updateMany(
    { category: { $in: ["Followers [E2E Auto]", "Followers [E2E Manual]"] }, active: true },
    { $set: { active: false } }
  );
  if (hiddenTests.modifiedCount) console.log(`Hidden ${hiddenTests.modifiedCount} leftover E2E services`);

  for (const [index, svc] of CATALOG.entries()) {
    await Service.findOneAndUpdate(
      { slug: svc.slug },
      {
        $set: {
          platformId: svc.platformId,
          platformLabel: PLATFORMS[svc.platformId].label,
          category: svc.category,
          kind: svc.kind,
          target: svc.target,
          sortOrder: index,
          tiers: catalogTiers(svc),
        },
        // Don't clobber admin-managed fields on re-seed.
        $setOnInsert: { active: true, supplierServiceId: null },
      },
      { upsert: true }
    );
    console.log(`Seeded service: ${svc.slug} (${svc.tiers.length} tiers)`);
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!process.argv.includes("--services-only") && adminEmail && adminPassword) {
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
