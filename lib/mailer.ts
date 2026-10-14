import { randomUUID } from "node:crypto";
import { dbConnect } from "@/lib/db/connect";
import { EmailOutbox } from "@/lib/db/models/Benefits";

// All transactional messages remain in the outbox until the provider is configured.
export async function sendMail(opts: { to: string; subject: string; text: string; idempotencyKey?: string }): Promise<boolean> {
  await dbConnect();
  const idempotencyKey = opts.idempotencyKey || `email:${randomUUID()}`;
  const message = await EmailOutbox.findOneAndUpdate({ key: idempotencyKey }, { $setOnInsert: { to: opts.to, subject: opts.subject, text: opts.text } }, { upsert: true, returnDocument: "after" });
  if (message.status === "sent") return true;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, text: opts.text }),
  });
  if (!response.ok) throw new Error("Email delivery failed");
  message.status = "sent"; await message.save();
  return true;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendMail({
    to: email,
    subject: "Reset your Surgeon password",
    text: `Click the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}`,
  });
}
