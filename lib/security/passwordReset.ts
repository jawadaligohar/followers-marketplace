import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { resetPasswordSchema } from "@/lib/validation/auth";

export function tokenDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function issuePasswordReset(userId: string) {
  await dbConnect();
  const token = randomBytes(32).toString("hex");
  await User.updateOne(
    { _id: userId, passwordHash: { $type: "string" } },
    {
      $set: {
        resetPasswordToken: tokenDigest(token),
        resetPasswordTokenExpiry: new Date(Date.now() + 3600000),
      },
    },
  );
  return token;
}
export async function consumePasswordReset(token: string, password: string) {
  resetPasswordSchema.parse({ token, password });
  await dbConnect();
  const passwordHash = await bcrypt.hash(password, 12);
  // Atomic consumption: concurrent uses cannot both replace the password.
  const result = await User.updateOne(
    {
      resetPasswordToken: tokenDigest(token),
      resetPasswordTokenExpiry: { $gt: new Date() },
      passwordHash: { $type: "string" },
    },
    {
      $set: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
      $inc: { sessionVersion: 1 },
    },
  );
  return result.modifiedCount === 1;
}
