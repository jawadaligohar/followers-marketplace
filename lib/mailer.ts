import { randomUUID } from "node:crypto";
import { dbConnect } from "@/lib/db/connect";
import { EmailOutbox } from "@/lib/db/models/Benefits";

// All transactional messages remain in the outbox until the provider is configured.
export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  idempotencyKey?: string;
}): Promise<boolean> {
  await dbConnect();
  const idempotencyKey = opts.idempotencyKey || `email:${randomUUID()}`;
  const message = await EmailOutbox.findOneAndUpdate(
    { key: idempotencyKey },
    { $setOnInsert: { to: opts.to, subject: opts.subject, text: opts.text } },
    { upsert: true, returnDocument: "after" },
  );
  if (message.status === "sent") return true;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    await EmailOutbox.updateOne(
      { _id: message._id },
      { $set: { lastError: "Email provider is not configured" } },
    );
    return false;
  }
  await EmailOutbox.updateOne(
    { _id: message._id },
    { $inc: { attempts: 1 }, $set: { lastAttemptAt: new Date() } },
  );
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!response.ok)
      throw new Error(
        `Email provider rejected the request (HTTP ${response.status})`,
      );
    const result = await response.json();
    await EmailOutbox.updateOne(
      { _id: message._id },
      {
        $set: {
          status: "sent",
          sentAt: new Date(),
          lastError: null,
          providerMessageId: typeof result.id === "string" ? result.id : null,
        },
      },
    );
    return true;
  } catch (error) {
    const reason =
      error instanceof Error &&
      error.message.startsWith("Email provider rejected")
        ? error.message
        : "Email provider request failed or timed out";
    await EmailOutbox.updateOne(
      { _id: message._id },
      { $set: { lastError: reason } },
    );
    throw new Error(reason);
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendMail({
    to: email,
    subject: "Reset your Surgeon password",
    text: `Click the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}`,
  });
}
