import { dbConnect } from "../lib/db/connect";
import { User } from "../lib/db/models/User";

async function makeAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.error("Please provide an email address. Example: npx tsx scripts/make-admin.ts user@example.com");
    process.exit(1);
  }

  await dbConnect();
  
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: "admin" },
    { new: true }
  );

  if (user) {
    console.log(`✅ Success! User ${user.email} is now an admin.`);
  } else {
    console.log(`❌ User with email ${email} not found.`);
  }
  
  process.exit(0);
}

makeAdmin();
