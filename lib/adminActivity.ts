import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { EmailOutbox } from "@/lib/db/models/Benefits";
import { Transaction } from "@/lib/db/models/Transaction";
import {
  ADMIN_PAGE_SIZE,
  pageNumber,
  searchValue,
  searchRegex,
  type AdminSearch,
} from "@/lib/adminQueries";
export async function adminEmailActivity(search: AdminSearch) {
  await dbConnect();
  const q = searchValue(search, "q");
  const status = searchValue(search, "status");
  const query = {
    ...(q && { $or: [{ to: searchRegex(q) }, { subject: searchRegex(q) }] }),
    ...(["sent", "pending"].includes(status) && { status }),
  };
  const total = await EmailOutbox.countDocuments(query);
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(pageNumber(search), pages);
  const messages = await EmailOutbox.find(query)
    .select(
      "to subject status key createdAt sentAt attempts lastAttemptAt lastError providerMessageId",
    )
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * ADMIN_PAGE_SIZE)
    .limit(ADMIN_PAGE_SIZE)
    .lean();
  return {
    rows: messages.map((message) => ({
      id: String(message._id),
      to: message.to,
      subject: message.subject,
      status: message.status as "pending" | "sent",
      kind: message.key.startsWith("paid:")
        ? "Order confirmation / bonus"
        : message.key.startsWith("verify:")
          ? "Email verification"
          : message.key.startsWith("draw:")
            ? "Monthly draw"
            : "Transactional",
      createdAt: message.createdAt.toISOString(),
      sentAt: message.sentAt?.toISOString() || null,
      attempts: message.attempts || 0,
      lastAttemptAt: message.lastAttemptAt?.toISOString() || null,
      lastError: message.lastError || null,
      providerMessageId: message.providerMessageId || null,
    })),
    page,
    pages,
    total,
  };
}
export async function adminTransactions(search: AdminSearch, userId?: string) {
  await dbConnect();
  const type = searchValue(search, "type");
  const q = searchValue(search, "q");
  const query = {
    ...(userId && { userId: new mongoose.Types.ObjectId(userId) }),
    ...([
      "topup",
      "order_debit",
      "refund",
      "admin_adjustment",
      "reward_credit",
    ].includes(type) && { type }),
    ...(q && {
      $or: [
        { note: searchRegex(q) },
        { stripeSessionId: searchRegex(q) },
        { stripePaymentIntentId: searchRegex(q) },
        { nowpaymentsPaymentId: searchRegex(q) },
        ...(mongoose.isValidObjectId(q)
          ? [{ relatedOrderId: new mongoose.Types.ObjectId(q) }]
          : []),
      ],
    }),
  };
  const total = await Transaction.countDocuments(query);
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(pageNumber(search), pages);
  const rows = await Transaction.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * ADMIN_PAGE_SIZE)
    .limit(ADMIN_PAGE_SIZE)
    .populate("userId", "name email")
    .lean();
  return {
    rows: rows.map((row) => ({
      id: String(row._id),
      type: row.type,
      amountCents: row.amountCents,
      balanceAfterCents: row.balanceAfterCents,
      note: row.note || "",
      createdAt: row.createdAt.toISOString(),
      relatedOrderId: row.relatedOrderId ? String(row.relatedOrderId) : null,
      processorReference:
        row.stripePaymentIntentId ||
        row.stripeSessionId ||
        row.nowpaymentsPaymentId ||
        row.nowpaymentsInvoiceId ||
        null,
      email:
        row.userId && typeof row.userId === "object" && "email" in row.userId
          ? String(row.userId.email)
          : "Account unavailable",
    })),
    total,
    page,
    pages,
  };
}
