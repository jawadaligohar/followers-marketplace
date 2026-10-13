import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getPeakerrClient } from "@/lib/supplier";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = getPeakerrClient();
  const isSandbox = client.isSandbox();
  const apiKeyConfigured = Boolean((process.env.PEAKERR_API_KEY || "").trim());

  try {
    const balance = await client.getBalance();
    return NextResponse.json({
      connected: true,
      mode: isSandbox ? "sandbox" : "live",
      apiKeyConfigured,
      balance: balance.balance,
      currency: balance.currency,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to connect to Peakerr";
    return NextResponse.json({
      connected: false,
      mode: isSandbox ? "sandbox" : "live",
      apiKeyConfigured,
      error: message,
    });
  }
}
